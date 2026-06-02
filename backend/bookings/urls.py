from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AvailabilitySlotViewSet, BookingViewSet

router = DefaultRouter()
router.register(r"availability", AvailabilitySlotViewSet, basename="availability")
router.register(r"", BookingViewSet, basename="booking")

urlpatterns = router.urls
