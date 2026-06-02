from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)
    service_title = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "booking",
            "customer",
            "customer_name",
            "provider",
            "service_title",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["customer", "provider", "created_at"]

    def get_service_title(self, obj):
        if obj.booking and obj.booking.service:
            return obj.booking.service.title
        return ""


class ReviewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Review.objects.select_related("customer", "provider", "booking__service")
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        provider = self.request.query_params.get("provider")
        service = self.request.query_params.get("service")
        if provider:
            qs = qs.filter(provider_id=provider)
        if service:
            qs = qs.filter(booking__service_id=service)
        return qs.order_by("-created_at")
