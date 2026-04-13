"""Input validation utilities for authentication."""

import re


def validate_email(email):
    """Validate email format."""
    if not email:
        return False, "Email is required"
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email.strip()):
        return False, "Invalid email format"
    return True, None


def validate_password(password):
    """
    Validate password strength.
    Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.
    """
    if not password:
        return False, "Password is required"
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, None


def validate_name(name):
    """Validate user name."""
    if not name or not name.strip():
        return False, "Name is required"
    if len(name.strip()) < 2:
        return False, "Name must be at least 2 characters"
    if len(name.strip()) > 50:
        return False, "Name must be less than 50 characters"
    return True, None


def validate_otp(otp):
    """Validate OTP format."""
    if not otp:
        return False, "OTP is required"
    if not re.match(r"^\d{6}$", str(otp)):
        return False, "OTP must be a 6-digit number"
    return True, None


def get_password_strength(password):
    """Calculate password strength score (0-5)."""
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if re.search(r"[A-Z]", password) and re.search(r"[a-z]", password):
        score += 1
    if re.search(r"\d", password):
        score += 1
    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 1
    return score
