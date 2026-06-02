from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def home(request):
    return JsonResponse({"message": "Service Marketplace API is running"})


urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    # accounts (users app)
    path("users/", include("users.urls")),
    path("accounts/", include("users.urls")),
    # provider profile & KYC
    path("providers/", include("kyc.urls")),
    path("kyc/", include("kyc.urls")),
    # services catalog
    path("services/", include("marketplace.urls")),
    path("bookings/", include("bookings.urls")),
    path("chat/", include("chats.urls")),
    path("portfolio/", include("portfolio.urls")),
    path("notifications/", include("notifications.urls")),
    path("reviews/", include("reviews.urls")),
    path("analytics/", include("analytics.urls")),
    path("maps/", include("maps.urls")),
    path("media/", include("media_app.urls")),
    path("api/token/", TokenObtainPairView.as_view()),
    path("api/token/refresh/", TokenRefreshView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
