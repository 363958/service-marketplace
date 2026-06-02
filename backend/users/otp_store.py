import time

OTP_TTL_SECONDS = 300

_otp_store: dict[str, dict] = {}


def set_otp(email: str, otp: str) -> None:
    _otp_store[email] = {
        "otp": otp,
        "expires_at": time.time() + OTP_TTL_SECONDS,
        "verified": False,
    }


def verify_otp_code(email: str, otp: str) -> tuple[bool, str]:
    entry = _otp_store.get(email)
    if not entry:
        return False, "OTP not found. Please request a new code."
    if time.time() > entry["expires_at"]:
        _otp_store.pop(email, None)
        return False, "OTP expired. Please request a new code."
    if entry["otp"] != str(otp).strip():
        return False, "Invalid OTP."
    entry["verified"] = True
    return True, ""


def is_otp_verified(email: str) -> bool:
    entry = _otp_store.get(email)
    return bool(entry and entry.get("verified"))


def clear_otp(email: str) -> None:
    _otp_store.pop(email, None)
