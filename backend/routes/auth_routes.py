"""Authentication routes — all auth endpoints."""
import os

import random
import secrets
import threading
from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from models.user import (
    create_user_document,
    hash_password,
    verify_password,
    sanitize_user,
)
from utils.validators import validate_email, validate_password, validate_name, validate_otp
from utils.email_service import send_otp_email, send_password_reset_email
from config import Config

import requests as http_requests

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def get_db():
    """Get MongoDB database instance."""
    return current_app.config["db"]


def send_email_async_aware(target_func, *args):
    """
    Send email synchronously on Vercel, and asynchronously elsewhere.
    Vercel freezes serverless functions after response is sent, so threads fail.
    """
    if os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"):
        # On Vercel, send synchronously to ensure completion
        print(f"[EMAIL] Running synchronously on Vercel...")
        target_func(*args)
    else:
        # On Local/Render, use a thread for speed
        threading.Thread(target=target_func, args=args).start()


# ─────────────────────────────────────────────────────────────────
# REGISTER
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user with email and password."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Validate inputs
    valid, err = validate_name(name)
    if not valid:
        return jsonify({"error": err}), 400

    valid, err = validate_email(email)
    if not valid:
        return jsonify({"error": err}), 400

    valid, err = validate_password(password)
    if not valid:
        return jsonify({"error": err}), 400

    db = get_db()

    # Check if email already exists
    existing = db.users.find_one({"email": email})
    if existing:
        return jsonify({"error": "An account with this email already exists"}), 409

    # Create user
    password_hash = hash_password(password)
    user_doc = create_user_document(name, email, password_hash, auth_provider="local")

    # Generate OTP for email verification
    otp_code = str(random.randint(100000, 999999))
    user_doc["otp"]["code"] = otp_code
    user_doc["otp"]["expires_at"] = datetime.now(timezone.utc).timestamp() + Config.OTP_EXPIRY.total_seconds()
    user_doc["otp"]["attempts"] = 0

    result = db.users.insert_one(user_doc)

    # Send OTP email using environment-aware helper
    send_email_async_aware(send_otp_email, email, otp_code, name.split()[0])
    
    email_sent = True

    # Also log to console as fallback
    print(f"[OTP] Registration OTP for {email}: {otp_code}")

    # Construct response message
    message = "Account created successfully. Please verify your email."
    if not email_sent:
        message += " (Note: Email delivery failed. In development, check the server console for the OTP.)"

    return jsonify({
        "message": message,
        "user_id": str(result.inserted_id),
        "email": email,
        "email_sent": email_sent,
        "requires_verification": True,
    }), 201


# ─────────────────────────────────────────────────────────────────
# VERIFY OTP
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """Verify email OTP code."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()

    valid, err = validate_email(email)
    if not valid:
        return jsonify({"error": err}), 400

    valid, err = validate_otp(otp)
    if not valid:
        return jsonify({"error": err}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.get("is_verified"):
        return jsonify({"error": "Email is already verified"}), 400

    user_otp = user.get("otp", {})

    # Check max attempts
    if user_otp.get("attempts", 0) >= 5:
        return jsonify({"error": "Too many failed attempts. Please request a new code."}), 429

    # Check expiry
    if user_otp.get("expires_at") and datetime.now(timezone.utc).timestamp() > user_otp["expires_at"]:
        return jsonify({"error": "OTP has expired. Please request a new code."}), 400

    # Verify OTP
    if user_otp.get("code") != otp:
        db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"otp.attempts": 1}}
        )
        remaining = 5 - (user_otp.get("attempts", 0) + 1)
        return jsonify({"error": f"Invalid OTP. {remaining} attempts remaining."}), 400

    # OTP is correct — verify user and clear OTP
    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_verified": True,
                "otp.code": None,
                "otp.expires_at": None,
                "otp.attempts": 0,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    # Generate tokens
    user_id = str(user["_id"])
    access_token = create_access_token(identity=user_id, additional_claims={"email": email})
    refresh_token = create_refresh_token(identity=user_id)

    # Get updated user
    updated_user = db.users.find_one({"_id": user["_id"]})

    return jsonify({
        "message": "Email verified successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": sanitize_user(updated_user),
    }), 200


# ─────────────────────────────────────────────────────────────────
# RESEND OTP
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    """Resend OTP verification code."""
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    valid, err = validate_email(email)
    if not valid:
        return jsonify({"error": err}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.get("is_verified"):
        return jsonify({"error": "Email is already verified"}), 400

    # Generate new OTP
    otp_code = str(random.randint(100000, 999999))

    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "otp.code": otp_code,
                "otp.expires_at": datetime.now(timezone.utc).timestamp() + Config.OTP_EXPIRY.total_seconds(),
                "otp.attempts": 0,
            }
        },
    )

    name = user.get("name", "").split()[0] or "there"
    
    # Send OTP email using environment-aware helper
    send_email_async_aware(send_otp_email, email, otp_code, name)
    
    print(f"[OTP] Resent OTP for {email}: {otp_code}")
    
    email_sent = True

    return jsonify({
        "message": "New verification code sent",
        "email_sent": email_sent,
    }), 200


# ─────────────────────────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    """Login with email and password."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    remember_me = data.get("remember_me", False)

    valid, err = validate_email(email)
    if not valid:
        return jsonify({"error": err}), 400

    if not password:
        return jsonify({"error": "Password is required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    # Check account lockout
    security = user.get("security", {})
    lockout_until = security.get("lockout_until")
    if lockout_until and datetime.now(timezone.utc).timestamp() < lockout_until:
        remaining_mins = int((lockout_until - datetime.now(timezone.utc).timestamp()) / 60) + 1
        return jsonify({
            "error": f"Account is temporarily locked. Try again in {remaining_mins} minutes.",
            "locked": True,
        }), 429

    # Check if user registered via Google and hasn't set a password
    if user.get("auth_provider") == "google" and not user.get("password_hash"):
        # Double check if password_hash is really missing/empty
        pass_hash = user.get("password_hash")
        if not pass_hash or pass_hash == "":
            return jsonify({
                "error": "This account uses Google sign-in. Please use the Google button to log in.",
                "use_google": True,
            }), 400

    # Verify password
    if not verify_password(password, user.get("password_hash", "")):
        failed_attempts = security.get("failed_login_attempts", 0) + 1

        update = {"$set": {"security.failed_login_attempts": failed_attempts}}

        # Lock account after max attempts
        if failed_attempts >= Config.MAX_LOGIN_ATTEMPTS:
            lockout_time = datetime.now(timezone.utc).timestamp() + Config.LOCKOUT_DURATION.total_seconds()
            update["$set"]["security.lockout_until"] = lockout_time
            db.users.update_one({"_id": user["_id"]}, update)
            return jsonify({
                "error": f"Account locked due to {failed_attempts} failed attempts. Try again in {int(Config.LOCKOUT_DURATION.total_seconds() / 60)} minutes.",
                "locked": True,
            }), 429

        db.users.update_one({"_id": user["_id"]}, update)
        remaining = Config.MAX_LOGIN_ATTEMPTS - failed_attempts
        return jsonify({"error": f"Invalid email or password. {remaining} attempts remaining."}), 401

    # Check if email is verified
    if not user.get("is_verified"):
        # Generate new OTP and send
        otp_code = str(random.randint(100000, 999999))
        db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "otp.code": otp_code,
                    "otp.expires_at": datetime.now(timezone.utc).timestamp() + Config.OTP_EXPIRY.total_seconds(),
                    "otp.attempts": 0,
                }
            },
        )
        name = user.get("name", "").split()[0] or "there"
        
        # Send OTP email using environment-aware helper
        send_email_async_aware(send_otp_email, email, otp_code, name)
        
        print(f"[OTP] Login verification OTP for {email}: {otp_code}")
        email_sent = True

        message = "Please verify your email first. A new code has been sent."
        if not email_sent:
            message += " (Note: Email delivery failed. In development, check the server console for the OTP.)"

        return jsonify({
            "message": message,
            "error": message,
            "requires_verification": True,
            "email": email,
            "email_sent": email_sent,
        }), 200

    # Success — reset failed attempts and update last login
    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "security.failed_login_attempts": 0,
                "security.lockout_until": None,
                "security.last_login": datetime.now(timezone.utc),
            }
        },
    )

    user_id = str(user["_id"])
    access_token = create_access_token(identity=user_id, additional_claims={"email": email})
    refresh_token = create_refresh_token(identity=user_id)

    updated_user = db.users.find_one({"_id": user["_id"]})

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": sanitize_user(updated_user),
    }), 200


# ─────────────────────────────────────────────────────────────────
# GOOGLE OAUTH
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/google", methods=["POST"])
def google_auth():
    """Authenticate with Google OAuth credential token."""
    data = request.get_json()
    credential = data.get("credential")

    if not credential:
        return jsonify({"error": "Google credential is required"}), 400

    # Verify the Google token
    try:
        # Verify token with Google's API
        google_response = http_requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        )

        if google_response.status_code != 200:
            return jsonify({"error": "Invalid Google token"}), 401

        google_data = google_response.json()

        # Verify audience matches our client ID
        if google_data.get("aud") != Config.GOOGLE_CLIENT_ID:
            return jsonify({"error": "Token was not issued for this application"}), 401

        google_email = google_data.get("email", "").lower()
        google_name = google_data.get("name", "")
        google_id = google_data.get("sub")
        avatar_url = google_data.get("picture")

        if not google_email:
            return jsonify({"error": "Could not retrieve email from Google"}), 400

    except Exception as e:
        print(f"[GOOGLE AUTH ERROR] {str(e)}")
        return jsonify({"error": "Failed to verify Google token"}), 500

    db = get_db()

    # Check if user exists
    user = db.users.find_one({"email": google_email})

    if user:
        # Existing user — update Google info and login
        db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "google_id": google_id,
                    "avatar_url": avatar_url,
                    "is_verified": True,
                    "security.last_login": datetime.now(timezone.utc),
                    "security.failed_login_attempts": 0,
                    "security.lockout_until": None,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        user = db.users.find_one({"_id": user["_id"]})
    else:
        # New user — create account
        user_doc = create_user_document(google_name, google_email, "", auth_provider="google")
        user_doc["google_id"] = google_id
        user_doc["avatar_url"] = avatar_url
        user_doc["is_verified"] = True
        user_doc["security"]["last_login"] = datetime.now(timezone.utc)

        result = db.users.insert_one(user_doc)
        user = db.users.find_one({"_id": result.inserted_id})

    user_id = str(user["_id"])
    access_token = create_access_token(identity=user_id, additional_claims={"email": google_email})
    refresh_token = create_refresh_token(identity=user_id)

    return jsonify({
        "message": "Google authentication successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": sanitize_user(user),
        "is_new_user": not user.get("profile_completed", False),
    }), 200


# ─────────────────────────────────────────────────────────────────
# FORGOT PASSWORD
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Send password reset email."""
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    valid, err = validate_email(email)
    if not valid:
        return jsonify({"error": err}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    # Always return success to prevent email enumeration
    success_msg = "If an account with that email exists, we've sent a password reset link."

    if not user:
        return jsonify({"message": success_msg}), 200

    # Removed restriction: allow Google users to set a password so they can use both login methods

    # Generate reset token
    reset_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc).timestamp() + Config.PASSWORD_RESET_EXPIRY.total_seconds()

    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token.token": reset_token,
                "reset_token.expires_at": expires_at,
            }
        },
    )

    reset_link = f"{Config.FRONTEND_URL}/auth/reset-password?token={reset_token}&email={email}"
    name = user.get("name", "").split()[0] or "there"
    
    # Send password reset email using environment-aware helper
    send_email_async_aware(send_password_reset_email, email, reset_link, name)

    print(f"[RESET] Password reset token for {email}: {reset_token}")
    print(f"[RESET] Reset link: {reset_link}")

    return jsonify({
        "message": success_msg,
        "email_sent": email_sent,
    }), 200


# ─────────────────────────────────────────────────────────────────
# RESET PASSWORD
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Reset password using token."""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "")

    if not token:
        return jsonify({"error": "Reset token is required"}), 400

    valid, err = validate_email(email)
    if not valid:
        return jsonify({"error": err}), 400

    valid, err = validate_password(new_password)
    if not valid:
        return jsonify({"error": err}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "Invalid or expired reset link"}), 400

    reset_data = user.get("reset_token", {})

    # Verify token
    if reset_data.get("token") != token:
        return jsonify({"error": "Invalid or expired reset link"}), 400

    # Check expiry
    if reset_data.get("expires_at") and datetime.now(timezone.utc).timestamp() > reset_data["expires_at"]:
        return jsonify({"error": "Reset link has expired. Please request a new one."}), 400

    # Update password
    new_hash = hash_password(new_password)
    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": new_hash,
                "reset_token.token": None,
                "reset_token.expires_at": None,
                "security.failed_login_attempts": 0,
                "security.lockout_until": None,
                "security.password_changed_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return jsonify({"message": "Password reset successfully. You can now log in."}), 200


# ─────────────────────────────────────────────────────────────────
# REFRESH TOKEN
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    user_id = get_jwt_identity()
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user or not user.get("is_active"):
        return jsonify({"error": "User not found or inactive"}), 401

    access_token = create_access_token(
        identity=user_id,
        additional_claims={"email": user.get("email")},
    )

    return jsonify({"access_token": access_token}), 200


# ─────────────────────────────────────────────────────────────────
# GET CURRENT USER
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Get current authenticated user's profile."""
    user_id = get_jwt_identity()
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": sanitize_user(user)}), 200


# ─────────────────────────────────────────────────────────────────
# PROFILE SETUP
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/profile-setup", methods=["POST"])
@jwt_required()
def profile_setup():
    """Save user profile/biometric data after signup."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Profile data is required"}), 400

    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    profile_data = {
        "profile.age": data.get("age"),
        "profile.gender": data.get("gender"),
        "profile.weight": data.get("weight"),
        "profile.height": data.get("height"),
        "profile.activity_level": data.get("activity_level"),
        "profile.dietary_goal": data.get("dietary_goal"),
        "profile.dietary_type": data.get("dietary_type", "both"),
        "profile.region": data.get("region", "Global"),
        "profile.diseases": data.get("diseases", []),
        "profile.allergies": data.get("allergies", []),
        "profile.restrictions": data.get("restrictions", []),
        "profile_completed": True,
        "updated_at": datetime.now(timezone.utc),

    }

    # Remove None values
    profile_data = {k: v for k, v in profile_data.items() if v is not None}

    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": profile_data})

    updated_user = db.users.find_one({"_id": ObjectId(user_id)})

    return jsonify({
        "message": "Profile setup complete",
        "user": sanitize_user(updated_user),
    }), 200

# ─────────────────────────────────────────────────────────────────
# UPDATE REGION
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/update-region", methods=["POST"])
@jwt_required()
def update_region():
    """Update user's selected region."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or "region" not in data:
        return jsonify({"error": "Region is required"}), 400

    db = get_db()
    
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "profile.region": data.get("region"),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    updated_user = db.users.find_one({"_id": ObjectId(user_id)})
    
    return jsonify({
        "message": "Region updated successfully",
        "user": sanitize_user(updated_user)
    }), 200


# ─────────────────────────────────────────────────────────────────
# UPDATE PROFILE
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update general user profile data."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Profile data is required"}), 400

    db = get_db()
    
    # Define fields allowed to be updated
    allowed_fields = [
        "age", "gender", "weight", "height", 
        "activity_level", "dietary_goal", "dietary_type", 
        "region", "diseases", "allergies", "restrictions"
    ]
    
    update_query = {}
    for field in allowed_fields:
        if field in data:
            update_query[f"profile.{field}"] = data[field]
    
    if "name" in data:
        update_query["name"] = data["name"]

    if not update_query:
        return jsonify({"error": "No valid fields to update"}), 400

    update_query["updated_at"] = datetime.now(timezone.utc)

    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_query})
    
    updated_user = db.users.find_one({"_id": ObjectId(user_id)})
    
    return jsonify({
        "message": "Profile updated successfully",
        "user": sanitize_user(updated_user)
    }), 200



# ─────────────────────────────────────────────────────────────────
# CHANGE PASSWORD
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """Change user password."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"error": "Current and new passwords are required"}), 400

    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # If user is Google-only (no password hash), they can set one here too
    if user.get("password_hash"):
        if not verify_password(current_password, user["password_hash"]):
            return jsonify({"error": "Invalid current password"}), 401

    # Validate new password
    valid, err = validate_password(new_password)
    if not valid:
        return jsonify({"error": err}), 400

    # Update password
    new_hash = hash_password(new_password)
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "password_hash": new_hash,
                "security.password_changed_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        }
    )

    return jsonify({"message": "Password updated successfully"}), 200


# ─────────────────────────────────────────────────────────────────
# LOGOUT (Token blacklist — optional)
# ─────────────────────────────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logout — client should discard tokens."""
    jti = get_jwt()["jti"]
    db = get_db()

    # Store revoked token
    db.revoked_tokens.insert_one({
        "jti": jti,
        "revoked_at": datetime.now(timezone.utc),
    })

    return jsonify({"message": "Logged out successfully"}), 200
