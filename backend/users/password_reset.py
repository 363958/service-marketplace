from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode


def make_password_reset_token(user) -> tuple[str, str]:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return uid, token


def verify_password_reset_token(uid: str, token: str):
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.get(pk=user_id)
    except Exception:
        return None
    if not default_token_generator.check_token(user, token):
        return None
    return user
