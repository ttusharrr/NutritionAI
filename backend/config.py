import os
from dotenv import load_dotenv
from datetime import timedelta

# Explicitly load .env from the backend directory
backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path)
else:
    load_dotenv()


class Config:
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/nutriai")

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 900))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 2592000))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # Email (SMTP & SendGrid fallback)
    SENDER_EMAIL = os.getenv("SENDER_EMAIL", "tushar427sharma@gmail.com")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587  # TLS (STARTTLS)

    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # App
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Security
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION = timedelta(minutes=15)
    OTP_EXPIRY = timedelta(minutes=10)
    PASSWORD_RESET_EXPIRY = timedelta(hours=1)
