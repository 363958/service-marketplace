from django.conf import settings
from django.db import models


class AvailabilitySlot(models.Model):
    STATUS_AVAILABLE = "available"
    STATUS_BOOKED = "booked"
    STATUS_BLOCKED = "blocked"

    STATUS_CHOICES = [
        (STATUS_AVAILABLE, "Available"),
        (STATUS_BOOKED, "Booked"),
        (STATUS_BLOCKED, "Blocked"),
    ]

    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="availability_slots",
    )
    service = models.ForeignKey(
        "marketplace.Service",
        on_delete=models.CASCADE,
        related_name="availability_slots",
        null=True,
        blank=True,
    )
    date = models.DateField()
    start_time = models.TimeField(default="09:00")
    end_time = models.TimeField(default="17:00")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_AVAILABLE
    )
    booking = models.OneToOneField(
        "Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="availability_slot",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "start_time"]
        unique_together = [["provider", "service", "date", "start_time"]]


class Booking(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_bookings",
        null=True,
        blank=True,
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="provider_bookings",
        null=True,
        blank=True,
    )
    service = models.ForeignKey(
        "marketplace.Service",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    booking_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("confirmed", "Confirmed"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        default="pending",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def cancel_and_release_slot(self):
        self.status = "cancelled"
        self.save(update_fields=["status"])
        slot = getattr(self, "availability_slot", None)
        if slot:
            slot.status = AvailabilitySlot.STATUS_AVAILABLE
            slot.booking = None
            slot.save(update_fields=["status", "booking"])
