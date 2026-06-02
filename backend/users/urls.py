from django.urls import path

from .views import send_otp, verify_otp_register, login
from .profile_views import (
    me,
    delete_profile_photo,
    change_password,
    forgot_password,
    reset_password,
    check_username,
    request_email_change,
    verify_email_change,
    update_profile,
)

urlpatterns = [
    path("send-otp/", send_otp),
    path("verify-otp-register/", verify_otp_register),
    path("login/", login),
    path("me/", me),
    path("me/photo/", delete_profile_photo),
    path("change-password/", change_password),
    path("forgot-password/", forgot_password),
    path("reset-password/", reset_password),
    path("check-username/", check_username),
    path("request-email-change/", request_email_change),
    path("verify-email-change/", verify_email_change),
    path("update-profile/", update_profile),
]
