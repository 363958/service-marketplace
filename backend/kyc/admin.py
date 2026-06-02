from django.contrib import admin
from django.core.mail import send_mail
from django.conf import settings

from .models import ProviderProfile


def _send_kyc_email(profile, subject, message):
    email = profile.user.email
    if not email:
        return
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:
        print("KYC EMAIL ERROR:", profile.user.username, exc)


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "service_type", "kyc_status", "is_verified", "location")
    list_filter = ("kyc_status", "is_verified")
    search_fields = ("user__username", "user__email", "phone", "location")

    actions = ["approve_kyc", "reject_kyc"]

    @admin.action(description="Approve selected KYC")
    def approve_kyc(self, request, queryset):
        for profile in queryset:
            profile.kyc_status = ProviderProfile.KYC_APPROVED
            profile.is_verified = True
            profile.save(update_fields=["kyc_status", "is_verified", "updated_at"])
            _send_kyc_email(
                profile,
                "KYC Approved — Service Marketplace",
                (
                    f"Hello {profile.user.username},\n\n"
                    f"Your KYC verification has been APPROVED.\n"
                    f"You can now publish services on the marketplace.\n\n"
                    f"Status: approved\n"
                    f"Verified: yes\n\n"
                    f"— Service Marketplace Team"
                ),
            )

    @admin.action(description="Reject selected KYC")
    def reject_kyc(self, request, queryset):
        for profile in queryset:
            profile.kyc_status = ProviderProfile.KYC_REJECTED
            profile.is_verified = False
            profile.save(update_fields=["kyc_status", "is_verified", "updated_at"])
            _send_kyc_email(
                profile,
                "KYC Rejected — Service Marketplace",
                (
                    f"Hello {profile.user.username},\n\n"
                    f"Your KYC verification was REJECTED.\n"
                    f"Please contact support or resubmit your documents.\n\n"
                    f"Status: rejected\n\n"
                    f"— Service Marketplace Team"
                ),
            )
