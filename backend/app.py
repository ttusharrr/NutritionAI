"""Flask Application — NutriAI Authentication Server."""

import os
import sys
import re
import logging
from datetime import datetime, timezone

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from config import Config


# ─────────────────────────────────────────────────────────────────
# Structured Logging for Render Dashboard
# ─────────────────────────────────────────────────────────────────
def setup_logging(app):
    """Configure structured logging that shows in Render dashboard logs."""
    # Force unbuffered stdout for Render (gunicorn captures stdout)
    if not sys.stdout.line_buffering:
        sys.stdout.reconfigure(line_buffering=True)
    if not sys.stderr.line_buffering:
        sys.stderr.reconfigure(line_buffering=True)

    # Configure root logger
    log_format = '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True,  # Override any existing logging config
    )
    
    # Create app-specific logger
    logger = logging.getLogger('nutriai')
    logger.setLevel(logging.DEBUG if app.debug else logging.INFO)
    
    # Reduce noisy third-party loggers
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('google').setLevel(logging.WARNING)
    logging.getLogger('pymongo').setLevel(logging.WARNING)
    
    return logger


def create_app():
    """Application factory."""
    app = Flask(__name__)

    # Load config
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = Config.JWT_REFRESH_TOKEN_EXPIRES
    app.config["JWT_TOKEN_LOCATION"] = Config.JWT_TOKEN_LOCATION

    # Setup structured logging
    logger = setup_logging(app)
    app.logger_nutriai = logger

    # CORS — allow frontend + mobile
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                Config.FRONTEND_URL, 
                "http://localhost:5173", 
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "https://nutrition-ai-nine.vercel.app",
                "https://nutritionai.onrender.com",
                # Allow all vercel.app and onrender.com domains for easier deployment
                re.compile(r"https://.*\.vercel\.app"),
                re.compile(r"http://.*\.vercel\.app"),
                re.compile(r"https://.*\.onrender\.com"),
                # Allow local network IP origins on any port for development
                re.compile(r"http://10\.\d+\.\d+\.\d+(:\d+)?"),
                re.compile(r"http://192\.168\.\d+\.\d+(:\d+)?"),
                re.compile(r"http://172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?")
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    })

    # JWT
    jwt = JWTManager(app)

    # Rate Limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://",
    )

    # MongoDB Connection
    try:
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=10000)
        # Force a connection test
        client.admin.command('ping')
        db = client.get_default_database()
        if db is None:
            db = client["nutriai"]
        app.config["db"] = db

        # Create indexes for performance
        db.users.create_index("email", unique=True)
        db.revoked_tokens.create_index("jti", unique=True)
        db.revoked_tokens.create_index("revoked_at", expireAfterSeconds=86400 * 30)  # Auto-delete after 30 days
        db.water_logs.create_index([("user_id", 1), ("date", -1)])

        logger.info(f"[DB] ✅ Connected to MongoDB: {db.name}")
    except Exception as e:
        logger.error(f"[DB] ❌ Failed to connect to MongoDB: {e}")
        # Use a local fallback for development
        try:
            client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
            db = client["nutriai"]
            app.config["db"] = db
            logger.warning("[DB] Using local MongoDB fallback")
        except Exception as local_err:
            logger.critical(f"[DB] ❌❌ FATAL: Cannot connect to any MongoDB: {local_err}")
            raise RuntimeError("No database connection available") from local_err

    # JWT token blocklist check
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = db.revoked_tokens.find_one({"jti": jti})
        return token is not None

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has been revoked", "code": "token_revoked"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired", "code": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid token", "code": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Authorization required", "code": "missing_token"}), 401

    # Error handlers for Limiter
    @app.errorhandler(429)
    def ratelimit_handler(e):
        logger.warning(f"[RATE LIMIT] Rate limit exceeded from {request.remote_addr}: {request.path}")
        return jsonify({
            "error": "Too many requests. Please try again later.",
            "code": "rate_limit_exceeded",
            "description": str(e.description)
        }), 429

    # ─────────────────────────────────────────────────────────────────
    # Request Logging Middleware — Visibility in Render logs
    # ─────────────────────────────────────────────────────────────────
    @app.before_request
    def log_request_start():
        """Log every incoming request for Render dashboard visibility."""
        # Skip health checks from noise
        if request.path in ('/', '/api/health', '/api/auth/health'):
            return
        logger.info(
            f"[REQ →] {request.method} {request.path} "
            f"from={request.remote_addr} "
            f"origin={request.headers.get('Origin', 'none')} "
            f"ua={request.headers.get('User-Agent', 'unknown')[:60]}"
        )

    @app.after_request
    def log_request_end(response):
        """Log response status for every request."""
        if request.path in ('/', '/api/health', '/api/auth/health'):
            return response
        
        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            level,
            f"[RES ←] {request.method} {request.path} "
            f"status={response.status_code} "
            f"size={response.content_length or 0}"
        )
        return response

    # Global error handler — catch unhandled exceptions
    @app.errorhandler(Exception)
    def handle_unhandled_exception(e):
        logger.exception(f"[UNHANDLED ERROR] {request.method} {request.path}: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "internal_error",
        }), 500

    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.diag_routes import diag_bp
    from routes.nutrition_routes import nutrition_bp
    from routes.water_routes import water_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(diag_bp)
    app.register_blueprint(nutrition_bp)
    app.register_blueprint(water_bp)

    # Apply rate limits to sensitive endpoints (Relaxed for development)
    limiter.limit("20 per minute")(auth_bp)

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "message": "NutriAI API is running!",
            "status": "online",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health():
        # Quick DB ping to verify actual health
        try:
            db.command('ping')
            db_status = "connected"
        except Exception:
            db_status = "disconnected"
        
        return jsonify({
            "status": "healthy",
            "service": "NutriAI Auth",
            "database": db_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }), 200

    logger.info("=" * 50)
    logger.info(f"NutriAI Backend initialized successfully")
    logger.info(f"Environment: {os.environ.get('FLASK_ENV', 'unknown')}")
    logger.info(f"Frontend URL: {Config.FRONTEND_URL}")
    logger.info(f"Google Client ID: {Config.GOOGLE_CLIENT_ID[:20] + '...' if Config.GOOGLE_CLIENT_ID else 'NOT SET'}")
    logger.info(f"Android Client ID: {Config.GOOGLE_ANDROID_CLIENT_ID[:20] + '...' if Config.GOOGLE_ANDROID_CLIENT_ID else 'NOT SET'}")
    logger.info("=" * 50)

    return app


from utils.ip_updater import update_config_files

# Automatically update IP address in config files on startup
# Run before app creation so environment variables are updated
# Trigger automatically when running locally (not on Render/Vercel) to simplify local mobile/web dev
if os.environ.get("FLASK_ENV") == "development" or (not os.environ.get("RENDER") and not os.environ.get("VERCEL")):
    update_config_files()

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=False)
