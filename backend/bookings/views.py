from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from marketplace.models import Service
from .models import AvailabilitySlot, Booking
from .utils import slot_overlaps


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilitySlot
        fields = [
            "id",
            "provider",
            "service",
            "date",
            "start_time",
            "end_time",
            "status",
            "booking",
        ]
        read_only_fields = ["provider", "booking"]

    def validate(self, attrs):
        start = attrs.get("start_time") or getattr(self.instance, "start_time", None)
        end = attrs.get("end_time") or getattr(self.instance, "end_time", None)
        date = attrs.get("date") or getattr(self.instance, "date", None)
        service = attrs.get("service") or getattr(self.instance, "service", None)

        if start and end and start >= end:
            raise ValidationError({"end_time": "End time must be after start time."})

        request = self.context.get("request")
        provider_id = None
        if request and request.user.is_authenticated:
            provider_id = request.user.id
        elif self.instance:
            provider_id = self.instance.provider_id

        if provider_id and date and start and end:
            exclude = self.instance.pk if self.instance else None
            if slot_overlaps(provider_id, date, start, end, exclude_id=exclude):
                raise ValidationError(
                    {"start_time": "This time overlaps with an existing slot on that date."}
                )

        if service and date and start and end:
            booked = AvailabilitySlot.objects.filter(
                service=service,
                date=date,
                status=AvailabilitySlot.STATUS_BOOKED,
            )
            if self.instance:
                booked = booked.exclude(pk=self.instance.pk)
            for other in booked:
                from .utils import time_ranges_overlap

                if time_ranges_overlap(start, end, other.start_time, other.end_time):
                    raise ValidationError(
                        {"start_time": "Time overlaps with an existing booking on this date."}
                    )

        return attrs


class BookingSerializer(serializers.ModelSerializer):
    slot_id = serializers.IntegerField(write_only=True, required=False)
    service_title = serializers.CharField(source="service.title", read_only=True)
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer",
            "provider",
            "service",
            "service_title",
            "booking_time",
            "status",
            "notes",
            "slot_id",
            "created_at",
            "can_cancel",
        ]
        read_only_fields = ["customer", "provider", "created_at", "can_cancel"]

    def get_can_cancel(self, obj):
        if obj.status in ("cancelled", "completed"):
            return False
        if not obj.booking_time:
            return True
        return obj.booking_time > timezone.now() + timedelta(hours=24)

    def create(self, validated_data):
        validated_data.pop("slot_id", None)
        return super().create(validated_data)


class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Customers (and guests) need to browse availability before booking.
        # Writes are still locked down to authenticated providers.
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = AvailabilitySlot.objects.select_related("service", "provider")
        provider = self.request.query_params.get("provider")
        service = self.request.query_params.get("service")
        month = self.request.query_params.get("month")

        user = self.request.user
        if user.is_authenticated and user.role == "provider" and not provider:
            qs = qs.filter(provider=user)
        elif provider:
            qs = qs.filter(provider_id=provider)
        if service:
            qs = qs.filter(service_id=service)
        if month:
            try:
                start = datetime.strptime(month, "%Y-%m").date()
                if start.month == 12:
                    end = start.replace(year=start.year + 1, month=1, day=1)
                else:
                    end = start.replace(month=start.month + 1, day=1)
                qs = qs.filter(date__gte=start, date__lt=end)
            except ValueError:
                pass
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        if self.request.user.role != "provider":
            raise PermissionDenied("Only providers can add availability.")
        serializer.save(provider=self.request.user, status=AvailabilitySlot.STATUS_AVAILABLE)

    def perform_update(self, serializer):
        slot = self.get_object()
        if slot.provider != self.request.user:
            raise PermissionDenied("Not your slot.")
        if slot.status == AvailabilitySlot.STATUS_BOOKED:
            raise ValidationError("Cannot edit a booked slot. Cancel booking first.")
        new_status = serializer.validated_data.get("status", slot.status)
        if new_status not in (
            AvailabilitySlot.STATUS_AVAILABLE,
            AvailabilitySlot.STATUS_BLOCKED,
        ):
            raise ValidationError("Invalid status for manual update.")
        serializer.save()

    @action(detail=True, methods=["post"])
    def toggle_block(self, request, pk=None):
        slot = self.get_object()
        if slot.provider != request.user:
            return Response({"error": "Not allowed"}, status=403)
        if slot.status == AvailabilitySlot.STATUS_BOOKED:
            return Response({"error": "Slot is booked"}, status=400)
        slot.status = (
            AvailabilitySlot.STATUS_BLOCKED
            if slot.status == AvailabilitySlot.STATUS_AVAILABLE
            else AvailabilitySlot.STATUS_AVAILABLE
        )
        slot.save(update_fields=["status"])
        return Response(AvailabilitySlotSerializer(slot).data)


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "provider":
            return Booking.objects.filter(provider=user).select_related("service")
        return Booking.objects.filter(customer=user).select_related("service")

    def perform_create(self, serializer):
        slot_id = self.request.data.get("slot_id")
        service = serializer.validated_data["service"]

        # Providers should not be able to book their own listings.
        if (
            self.request.user.role == "provider"
            and service.provider_id == self.request.user.id
        ):
            raise PermissionDenied("You cannot book your own service listing.")

        if not slot_id:
            raise ValidationError({"slot_id": "Select an available time slot."})

        try:
            slot = AvailabilitySlot.objects.get(
                id=slot_id,
                service=service,
                status=AvailabilitySlot.STATUS_AVAILABLE,
            )
        except AvailabilitySlot.DoesNotExist:
            raise ValidationError("Selected slot is not available.")

        from .utils import time_ranges_overlap

        booked_on_day = AvailabilitySlot.objects.filter(
            provider=service.provider,
            date=slot.date,
            status=AvailabilitySlot.STATUS_BOOKED,
        ).exclude(pk=slot.pk)
        for other in booked_on_day:
            if time_ranges_overlap(
                slot.start_time, slot.end_time, other.start_time, other.end_time
            ):
                raise ValidationError(
                    "This time overlaps with an existing booking. Choose another slot."
                )

        booking = serializer.save(
            customer=self.request.user,
            provider=service.provider,
            status="pending",
            booking_time=timezone.make_aware(datetime.combine(slot.date, slot.start_time)),
        )

        slot.status = AvailabilitySlot.STATUS_BOOKED
        slot.booking = booking
        slot.save(update_fields=["status", "booking"])

    def _send_status_email(self, booking: Booking, status_label: str):
        customer = booking.customer
        if not customer or not customer.email:
            return

        when = (
            booking.booking_time.astimezone(timezone.get_current_timezone()).strftime(
                "%Y-%m-%d %I:%M %p"
            )
            if booking.booking_time
            else "scheduled time"
        )
        service_title = booking.service.title if booking.service else "service"
        subject = f"Booking {status_label.lower()} — Service Marketplace"
        message = (
            f"Hello {customer.username},\n\n"
            f"Your booking for '{service_title}' has been {status_label.lower()} by the provider.\n"
            f"Time: {when}\n"
            f"Status: {status_label.lower()}\n\n"
            "You can view the latest booking status in your dashboard.\n"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[customer.email],
                fail_silently=False,
            )
        except Exception:
            # Do not fail state updates if email delivery fails.
            pass

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if booking.provider != user and user.role != "admin":
            return Response({"error": "Not allowed"}, status=403)
        if booking.status != "pending":
            return Response(
                {"error": "Only pending bookings can be accepted."}, status=400
            )

        booking.status = "confirmed"
        booking.save(update_fields=["status"])
        self._send_status_email(booking, "confirmed")

        # Auto-create a chat room for this booking
        from chats.models import ChatRoom

        chat_room, _ = ChatRoom.objects.get_or_create(
            booking=booking,
            defaults={
                "customer": booking.customer,
                "provider": booking.provider,
            },
        )

        return Response(
            {
                "message": "Booking accepted successfully.",
                "booking_id": booking.id,
                "status": booking.status,
                "chat_room_id": chat_room.id,
            }
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if booking.provider != user and user.role != "admin":
            return Response({"error": "Not allowed"}, status=403)
        if booking.status != "pending":
            return Response(
                {"error": "Only pending bookings can be rejected."}, status=400
            )

        booking.status = "cancelled"
        booking.save(update_fields=["status"])
        slot = getattr(booking, "availability_slot", None)
        if slot:
            slot.status = AvailabilitySlot.STATUS_AVAILABLE
            slot.booking = None
            slot.save(update_fields=["status", "booking"])

        self._send_status_email(booking, "cancelled")

        return Response(
            {
                "message": "Booking rejected successfully.",
                "booking_id": booking.id,
                "status": booking.status,
            }
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if user not in (booking.customer, booking.provider) and user.role != "admin":
            return Response({"error": "Not allowed"}, status=403)
        if booking.status == "cancelled":
            return Response({"message": "Already cancelled"})
        if booking.status == "completed":
            return Response({"error": "Completed bookings cannot be cancelled."}, status=400)
        if booking.booking_time and booking.booking_time <= timezone.now() + timedelta(
            hours=24
        ):
            return Response(
                {
                    "error": "Too late to cancel",
                    "message": "Cancellations must be at least 24 hours before the appointment.",
                },
                status=400,
            )
        booking.cancel_and_release_slot()
        return Response(BookingSerializer(booking).data)
