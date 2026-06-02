import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0003_remove_booking_created_at_remove_booking_date_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("marketplace", "0003_serviceimage"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="notes",
            field=models.TextField(blank=True),
        ),
        migrations.CreateModel(
            name="AvailabilitySlot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("start_time", models.TimeField(default="09:00")),
                ("end_time", models.TimeField(default="17:00")),
                (
                    "status",
                    models.CharField(
                        choices=[("available", "Available"), ("booked", "Booked"), ("blocked", "Blocked")],
                        default="available",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "provider",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="availability_slots",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "service",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="availability_slots",
                        to="marketplace.service",
                    ),
                ),
            ],
            options={"ordering": ["date", "start_time"]},
        ),
        migrations.AddField(
            model_name="availabilityslot",
            name="booking",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="availability_slot",
                to="bookings.booking",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="availabilityslot",
            unique_together={("provider", "service", "date", "start_time")},
        ),
    ]
