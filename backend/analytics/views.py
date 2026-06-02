from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views import View

from bookings.models import Booking
from kyc.models import ProviderProfile
from marketplace.models import Service


class AnalyticsSummaryView(View):
    def get(self, request):
        User = get_user_model()
        return JsonResponse(
            {
                "total_users": User.objects.count(),
                "total_providers": User.objects.filter(role="provider").count(),
                "verified_providers": ProviderProfile.objects.filter(
                    is_verified=True
                ).count(),
                "pending_kyc": ProviderProfile.objects.filter(
                    kyc_status=ProviderProfile.KYC_SUBMITTED
                ).count(),
                "active_services": Service.objects.count(),
                "bookings_today": Booking.objects.count(),
            }
        )
