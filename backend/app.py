"""Flask Application — NutriAI Authentication Server."""

import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from config import Config


def create_app():
    """Application factory."""
    app = Flask(__name__)

    # Load config
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = Config.JWT_REFRESH_TOKEN_EXPIRES
    app.config["JWT_TOKEN_LOCATION"] = Config.JWT_TOKEN_LOCATION

    # CORS — allow frontend
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                Config.FRONTEND_URL, 
                "http://localhost:5173", 
                "http://10.253.8.168:5173",
                "http://localhost:3000"
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
        client = MongoClient(Config.MONGO_URI)
        db = client.get_default_database()
        if db is None:
            db = client["nutriai"]
        app.config["db"] = db

        # Create indexes for performance
        db.users.create_index("email", unique=True)
        db.revoked_tokens.create_index("jti", unique=True)
        db.revoked_tokens.create_index("revoked_at", expireAfterSeconds=86400 * 30)  # Auto-delete after 30 days

        print(f"[DB] Connected to MongoDB: {db.name}")
    except Exception as e:
        print(f"[DB ERROR] Failed to connect to MongoDB: {e}")
        # Use a local fallback for development
        client = MongoClient("mongodb://localhost:27017/")
        db = client["nutriai"]
        app.config["db"] = db
        print("[DB] Using local MongoDB fallback")

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

    # Register blueprints
    from routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    # Apply rate limits to sensitive endpoints
    limiter.limit("5 per minute")(auth_bp)

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "healthy", "service": "NutriAI Auth"}), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
