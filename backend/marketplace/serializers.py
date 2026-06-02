from rest_framework import serializers

from reviews.models import Review
from .models import Service, ServiceImage


class ServiceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ["id", "image_url", "caption", "sort_order"]


class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source="provider.username", read_only=True)
    provider_verified = serializers.SerializerMethodField()
    distance_km = serializers.FloatField(read_only=True, required=False)
    images = ServiceImageSerializer(many=True, read_only=True)
    image_urls = serializers.ListField(
        child=serializers.URLField(max_length=500),
        write_only=True,
        required=False,
    )
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "provider",
            "provider_name",
            "provider_verified",
            "title",
            "description",
            "price",
            "location",
            "latitude",
            "longitude",
            "distance_km",
            "images",
            "image_urls",
            "avg_rating",
            "review_count",
            "created_at",
        ]
        read_only_fields = ["provider", "created_at", "distance_km", "avg_rating", "review_count"]

    def get_provider_verified(self, obj):
        profile = getattr(obj.provider, "provider_profile", None)
        return bool(profile and profile.is_verified)

    def get_avg_rating(self, obj):
        reviews = Review.objects.filter(provider=obj.provider)
        if not reviews.exists():
            return 0
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)

    def get_review_count(self, obj):
        return Review.objects.filter(provider=obj.provider).count()

    def create(self, validated_data):
        image_urls = validated_data.pop("image_urls", [])
        loc = validated_data.get("location", "")
        if loc and not validated_data.get("latitude"):
            from .geo import coords_for_location
            lat, lng = coords_for_location(loc)
            validated_data["latitude"] = lat
            validated_data["longitude"] = lng
        service = super().create(validated_data)
        for i, url in enumerate(image_urls[:10]):
            ServiceImage.objects.create(service=service, image_url=url, sort_order=i)
        return service
