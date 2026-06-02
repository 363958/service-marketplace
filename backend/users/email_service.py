from django.core.mail import send_mail
from django.conf import settings

def send_email_otp(email, otp):
    send_mail(
        subject="Your OTP Code",
        message=f"Your OTP is: {otp}. It expires in 5 minutes.",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )