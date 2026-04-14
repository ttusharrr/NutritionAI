"""User model and helper functions for MongoDB."""

import bcrypt
from datetime import datetime, timezone
from utils.nutrition_calc import calculate_daily_requirements


def create_user_document(name, email, password_hash, auth_provider="local"):
    """Create a standardized user document for MongoDB."""
    return {
        "name": name,
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "auth_provider": auth_provider,  # "local" or "google"
        "google_id": None,
        "avatar_url": None,
        "is_verified": False,
        "is_active": True,
        "profile_completed": False,
        "profile": {
            "age": None,
            "gender": None,
            "weight": None,
            "height": None,
            "activity_level": None,
            "dietary_goal": None,
            "region": "Punjab",
            "restrictions": [],
        },

        "security": {
            "failed_login_attempts": 0,
            "lockout_until": None,
            "last_login": None,
            "password_changed_at": datetime.now(timezone.utc),
        },
        "otp": {
            "code": None,
            "expires_at": None,
            "attempts": 0,
        },
        "reset_token": {
            "token": None,
            "expires_at": None,
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


def hash_password(password):
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password, password_hash):
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def sanitize_user(user):
    """Remove sensitive fields from user document for API responses."""
    if user is None:
        return None
    profile = user.get("profile", {})
    nutrition = calculate_daily_requirements(profile) if user.get("profile_completed") else None

    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "avatar_url": user.get("avatar_url"),
        "auth_provider": user.get("auth_provider", "local"),
        "is_verified": user.get("is_verified", False),
        "profile_completed": user.get("profile_completed", False),
        "profile": profile,
        "daily_nutrition": nutrition,
        "created_at": user.get("created_at", ""),
    }

