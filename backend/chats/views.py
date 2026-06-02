from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from bookings.models import Booking
from notifications.models import Notification
from .models import ChatMessage, ChatRoom


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "sender", "sender_name", "text", "image_url", "is_read", "created_at"]
        read_only_fields = ["id", "sender", "sender_name", "is_read", "created_at"]


class ChatRoomSerializer(serializers.ModelSerializer):
    other_user_name = serializers.SerializerMethodField()
    other_user_photo = serializers.SerializerMethodField()
    service_title = serializers.CharField(source="booking.service.title", read_only=True, default="")
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "booking",
            "customer",
            "provider",
            "other_user_name",
            "other_user_photo",
            "service_title",
            "last_message",
            "unread_count",
            "is_active",
            "created_at",
        ]

    def _other_user(self, obj):
        user = self.context["request"].user
        return obj.provider if user.id == obj.customer_id else obj.customer

    def get_other_user_name(self, obj):
        return self._other_user(obj).username

    def get_other_user_photo(self, obj):
        other = self._other_user(obj)
        if other.profile_photo:
            return self.context["request"].build_absolute_uri(other.profile_photo.url)
        return ""

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        return ChatMessageSerializer(msg).data

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_rooms(request):
    """Return all chat rooms for the authenticated user."""
    rooms = ChatRoom.objects.filter(
        Q(customer=request.user) | Q(provider=request.user)
    ).select_related("booking__service", "customer", "provider").order_by("-created_at")
    data = ChatRoomSerializer(rooms, many=True, context={"request": request}).data
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def room_messages(request, room_id):
    """Return messages for a specific room (newest first, capped at 100)."""
    try:
        room = ChatRoom.objects.get(pk=room_id)
    except ChatRoom.DoesNotExist:
        return Response({"error": "Chat room not found."}, status=404)

    if request.user not in (room.customer, room.provider):
        return Response({"error": "Not allowed."}, status=403)

    messages = room.messages.select_related("sender").order_by("-created_at")[:100]
    data = ChatMessageSerializer(messages, many=True).data

    # Mark messages from the other user as read
    room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    return Response(list(reversed(data)))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, room_id):
    """Send a text (or image) message to a room."""
    try:
        room = ChatRoom.objects.get(pk=room_id)
    except ChatRoom.DoesNotExist:
        return Response({"error": "Chat room not found."}, status=404)

    if request.user not in (room.customer, room.provider):
        return Response({"error": "Not allowed."}, status=403)

    if not room.is_active:
        return Response({"error": "This chat is no longer active."}, status=400)

    text = request.data.get("text", "").strip()
    image_url = request.data.get("image_url", "").strip()

    if not text and not image_url:
        return Response({"error": "Message text or image is required."}, status=400)

    msg = ChatMessage.objects.create(
        room=room,
        sender=request.user,
        text=text,
        image_url=image_url,
    )

    # Notify the other user
    other = room.provider if request.user.id == room.customer_id else room.customer
    Notification.objects.create(
        user=other,
        title="New message",
        body=text[:120] if text else "[Photo]",
        event_type="chat_message",
    )

    return Response(ChatMessageSerializer(msg).data, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_read(request, room_id):
    """Mark all messages in a room from the other user as read."""
    try:
        room = ChatRoom.objects.get(pk=room_id)
    except ChatRoom.DoesNotExist:
        return Response({"error": "Chat room not found."}, status=404)

    if request.user not in (room.customer, room.provider):
        return Response({"error": "Not allowed."}, status=403)

    room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
    return Response({"message": "Marked as read."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def room_for_booking(request, booking_id):
    """Get or return the chat room linked to a booking."""
    try:
        booking = Booking.objects.get(pk=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if request.user not in (booking.customer, booking.provider):
        return Response({"error": "Not allowed."}, status=403)

    room = getattr(booking, "chat_room", None)
    if room is None:
        return Response({"error": "No chat room for this booking yet."}, status=404)

    return Response(ChatRoomSerializer(room, context={"request": request}).data)
