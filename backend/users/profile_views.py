import random
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from kyc.models import ProviderProfile
from .password_reset import make_password_reset_token, verify_password_reset_token
from .otp_store import set_otp, verify_otp_code, is_otp_verified, clear_otp

User = get_user_model()

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if request.method == "GET":
        return Response(_user_profile_payload(user, request))

    # Handle username update
    new_username = request.data.get("username")
    if new_username and new_username != user.username:
        if User.objects.filter(username__iexact=new_username).exists():
            return Response({"error": "Username already exists."}, status=400)
        user.username = new_username
        user.save(update_fields=["username"])

    # Handle profile photo update
    if "profile_photo" in request.FILES:
        user.profile_photo = request.FILES["profile_photo"]
        user.save(update_fields=["profile_photo"])
        
    return Response(_user_profile_payload(user, request))

# ...
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_email_change(request):
    new_email = _normalize_email(request.data.get("email"))
    if not new_email:
        return Response({"error": "New email is required."}, status=400)
    if User.objects.filter(email=new_email).exists():
        return Response({"error": "Email already in use."}, status=400)
    
    otp = str(random.randint(100000, 999999))
    set_otp(new_email, otp)
    
    try:
        send_mail(
            subject="Verify your new email - Service Marketplace",
            message=f"Your OTP for email change is: {otp}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
            fail_silently=False,
        )
        return Response({"message": "OTP sent to new email."})
    except Exception as e:
        return Response({"error": "Failed to send email."}, status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_email_change(request):
    new_email = _normalize_email(request.data.get("email"))
    otp = request.data.get("otp")
    
    if not new_email or not otp:
        return Response({"error": "Email and OTP are required."}, status=400)
    
    otp_ok, otp_error = verify_otp_code(new_email, otp)
    if not otp_ok:
        return Response({"error": otp_error}, status=400)
    
    user = request.user
    user.email = new_email
    user.save(update_fields=["email"])
    clear_otp(new_email)
    
    return Response({"message": "Email updated successfully."})


def _normalize_email(email):
    return (email or "").strip().lower()


def _profile_photo_url(user, request=None):
    if not user.profile_photo:
        return ""
    # Return relative path so the frontend can resolve against its own API base URL.
    return user.profile_photo.url


def _user_profile_payload(user, request=None):
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "phone": user.phone or "",
        "profile_photo": _profile_photo_url(user, request),
    }
    if user.role == "provider":
        profile = getattr(user, "provider_profile", None)
        if profile is None:
            profile, _ = ProviderProfile.objects.get_or_create(user=user)
        data["kyc_status"] = profile.kyc_status
        data["is_verified"] = profile.is_verified
    return data

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user

    # Handle username update
    new_username = request.data.get("username")
    if new_username and new_username != user.username:
        if User.objects.filter(username__iexact=new_username).exists():
            return Response({"error": "Username already exists."}, status=400)
        user.username = new_username
        user.save(update_fields=["username"])

    # Handle profile photo update
    if "profile_photo" in request.FILES:
        user.profile_photo = request.FILES["profile_photo"]
        user.save(update_fields=["profile_photo"])

    return Response(_user_profile_payload(user, request))



@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_profile_photo(request):
    user = request.user
    if user.profile_photo:
        user.profile_photo.delete(save=False)
    user.profile_photo = None
    user.save(update_fields=["profile_photo"])
    return Response(_user_profile_payload(user, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current = request.data.get("current_password", "")
    new_password = request.data.get("new_password", "")

    if not current or not new_password:
        return Response({"error": "Current and new password are required."}, status=400)
    if len(new_password) < 6:
        return Response({"error": "New password must be at least 6 characters."}, status=400)
    if not user.check_password(current):
        return Response({"error": "Current password is incorrect."}, status=400)

    user.set_password(new_password)
    user.save(update_fields=["password"])
    return Response({"message": "Password updated successfully."})


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def forgot_password(request):
    email = _normalize_email(request.data.get("email"))
    if not email:
        return Response({"error": "Email is required."}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {
                "message": "If that email is registered, a reset link has been sent.",
                "email_sent": True,
            }
        )

    uid, token = make_password_reset_token(user)
    app_url = getattr(settings, "FRONTEND_APP_URL", "http://localhost:8081")
    reset_path = f"/reset-password?uid={uid}&token={token}&email={email}"

    body = (
        f"Hello {user.username},\n\n"
        f"You requested a password reset for Service Marketplace.\n\n"
        f"Open the app → Reset Password and enter:\n"
        f"  Email: {email}\n"
        f"  Reset token: {token}\n"
        f"  User ID: {uid}\n\n"
        f"Or open: {app_url}{reset_path}\n\n"
        f"This link expires in 24 hours. If you did not request this, ignore this email.\n"
    )

    try:
        send_mail(
            subject="Reset your password — Service Marketplace",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({"message": "Password reset email sent.", "email_sent": True})
    except Exception as exc:
        if settings.DEBUG:
            print("PASSWORD RESET TOKEN FOR", email, ":", token, "uid:", uid)
            return Response(
                {
                    "message": "Email could not be sent. Check server console in dev.",
                    "email_sent": False,
                }
            )
        return Response({"error": "Could not send email.", "details": str(exc)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password(request):
    email = _normalize_email(request.data.get("email"))
    uid = request.data.get("uid", "")
    token = request.data.get("token", "")
    new_password = request.data.get("new_password", "")

    if not email or not uid or not token or not new_password:
        return Response({"error": "Email, token, and new password are required."}, status=400)
    if len(new_password) < 6:
        return Response({"error": "Password must be at least 6 characters."}, status=400)

    user = verify_password_reset_token(uid, token)
    if user is None or _normalize_email(user.email) != email:
        return Response({"error": "Invalid or expired reset token."}, status=400)

    user.set_password(new_password)
    user.save(update_fields=["password"])
    return Response({"message": "Password reset successful. You can sign in now."})


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def check_username(request):
    username = (request.data.get("username") or "").strip()
    if not username:
        return Response({"error": "Username is required."}, status=400)
    available = not User.objects.filter(username__iexact=username).exists()
    return Response({"available": available, "username": username})
