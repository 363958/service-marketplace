from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from kyc.models import ProviderProfile
from marketplace.models import Service, ServiceImage
from reviews.models import Review
from bookings.models import AvailabilitySlot, Booking

User = get_user_model()

SAMPLES = [
    {
        "username": "demo_plumber",
        "title": "Expert Plumbing",
        "description": "Leak repairs, pipe fitting, and bathroom installations.",
        "price": "1500",
        "location": "Kathmandu",
        "image_seed": "plumbing",
    },
    {
        "username": "demo_cleaner",
        "title": "Home Deep Cleaning",
        "description": "Full home sanitization and move-in/move-out cleaning.",
        "price": "2500",
        "location": "Lalitpur",
        "image_seed": "cleaning",
    },
    {
        "username": "demo_electric",
        "title": "Licensed Electrician",
        "description": "Wiring, fixtures, and emergency electrical repairs.",
        "price": "1200",
        "location": "Bhaktapur",
        "image_seed": "electric",
    },
    {
        "username": "demo_pokhara",
        "title": "Pokhara AC Servicing",
        "description": "AC installation, gas refill, and repair across Pokhara lakeside area.",
        "price": "1800",
        "location": "Pokhara",
        "image_seed": "ac-pokhara",
    },
]

REVIEWS = [
    ("Great work, very professional!", 5),
    ("Arrived on time and fixed the issue quickly.", 5),
    ("Good service, fair price.", 4),
    ("Highly recommend for home repairs.", 5),
    ("Communication was excellent throughout.", 4),
]


class Command(BaseCommand):
    help = "Seed demo services, images, reviews, and calendar slots"

    def handle(self, *args, **options):
        created_services = 0
        today = timezone.now().date()

        for item in SAMPLES:
            user, _ = User.objects.get_or_create(
                username=item["username"],
                defaults={
                    "email": f"{item['username']}@demo.local",
                    "role": "provider",
                },
            )
            if not user.has_usable_password():
                user.set_password("demo1234")
                user.save()

            profile, _ = ProviderProfile.objects.get_or_create(user=user)
            profile.kyc_status = ProviderProfile.KYC_APPROVED
            profile.is_verified = True
            profile.service_type = profile.service_type or item["title"].split()[0]
            profile.location = profile.location or item["location"]
            profile.save()

            service, was_created = Service.objects.get_or_create(
                provider=user,
                title=item["title"],
                defaults={
                    "description": item["description"],
                    "price": item["price"],
                    "location": item["location"],
                },
            )
            if was_created:
                created_services += 1

            seed = item["image_seed"]
            for i in range(3):
                ServiceImage.objects.get_or_create(
                    service=service,
                    sort_order=i,
                    defaults={
                        "image_url": f"https://picsum.photos/seed/{seed}-{i}/800/500",
                        "caption": f"{item['title']} photo {i + 1}",
                    },
                )

            TIME_SLOTS = [
                ("09:00", "11:00"),
                ("11:00", "13:00"),
                ("14:00", "16:00"),
                ("16:00", "18:00"),
            ]
            for day_offset in range(1, 21):
                d = today + timedelta(days=day_offset)
                for start_t, end_t in TIME_SLOTS:
                    AvailabilitySlot.objects.get_or_create(
                        provider=user,
                        service=service,
                        date=d,
                        start_time=start_t,
                        defaults={
                            "end_time": end_t,
                            "status": AvailabilitySlot.STATUS_AVAILABLE,
                        },
                    )

            customer, _ = User.objects.get_or_create(
                username="demo_customer",
                defaults={"email": "customer@demo.local", "role": "customer"},
            )
            if not customer.has_usable_password():
                customer.set_password("demo1234")
                customer.save()

            for idx, (comment, rating) in enumerate(REVIEWS[:3]):
                booking, _ = Booking.objects.get_or_create(
                    customer=customer,
                    service=service,
                    provider=user,
                    defaults={
                        "status": "completed",
                        "booking_time": timezone.now(),
                    },
                )
                Review.objects.get_or_create(
                    booking=booking,
                    defaults={
                        "customer": customer,
                        "provider": user,
                        "rating": rating,
                        "comment": comment,
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {created_services} new service(s). Images, slots & reviews seeded."
            )
        )
