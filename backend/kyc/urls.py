from django.urls import path

from .views import KycSubmitView, ProviderProfileView

urlpatterns = [
    path("profile/", ProviderProfileView.as_view(), name="provider-profile"),
    path("submit/", KycSubmitView.as_view(), name="kyc-submit"),
]
