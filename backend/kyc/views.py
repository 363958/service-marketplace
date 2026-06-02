from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProviderProfile
from .serializers import ProviderProfileSerializer


class ProviderProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get_profile(self, user):
        profile, _ = ProviderProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can access this profile."},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile = self.get_profile(request.user)
        return Response(ProviderProfileSerializer(profile).data)

    def post(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can update this profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        profile = self.get_profile(request.user)
        data = {
            "service_type": request.data.get("service") or request.data.get("service_type", ""),
            "phone": request.data.get("phone", ""),
            "location": request.data.get("location", ""),
        }

        serializer = ProviderProfileSerializer(profile, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if request.user.phone != data["phone"] and data["phone"]:
            request.user.phone = data["phone"]
            request.user.save(update_fields=["phone"])

        return Response(ProviderProfileSerializer(profile).data)


class KycSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can submit KYC."},
                status=status.HTTP_403_FORBIDDEN,
            )

        profile, _ = ProviderProfile.objects.get_or_create(user=request.user)
        if not profile.profile_completed:
            return Response(
                {"error": "Complete provider setup before KYC."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        id_number = request.data.get("id_number", "")
        if id_number:
            profile.id_number = id_number

        profile.kyc_status = ProviderProfile.KYC_SUBMITTED
        profile.save(update_fields=["id_number", "kyc_status", "updated_at"])

        return Response(ProviderProfileSerializer(profile).data)
