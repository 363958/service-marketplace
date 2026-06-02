from rest_framework import serializers

from .models import ProviderProfile


class ProviderProfileSerializer(serializers.ModelSerializer):
    profile_completed = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            "service_type",
            "phone",
            "location",
            "id_number",
            "kyc_status",
            "is_verified",
            "profile_completed",
        ]
        read_only_fields = ["kyc_status", "is_verified", "profile_completed"]
