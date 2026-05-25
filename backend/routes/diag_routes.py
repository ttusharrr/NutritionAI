import os
import socket
import logging
from flask import Blueprint, jsonify, request
from config import Config

logger = logging.getLogger('nutriai.diag')

diag_bp = Blueprint("diagnostics", __name__, url_prefix="/api/diag")

@diag_bp.route("/network-check", methods=["GET"])
def network_check():
    """Network diagnostics for debugging email and API connectivity."""
    results = {}
    
    # 1. DNS Check
    try:
        ip = socket.gethostbyname("smtp.gmail.com")
        results["dns"] = {"status": "success", "ip": ip}
    except Exception as e:
        results["dns"] = {"status": "failed", "error": str(e)}
        
    # 2. Port 465 Check (SSL)
    try:
        s = socket.create_connection(("smtp.gmail.com", 465), timeout=5)
        s.close()
        results["port_465"] = {"status": "open"}
    except Exception as e:
        results["port_465"] = {"status": "closed/blocked", "error": str(e)}
        
    # 3. Port 587 Check (TLS)
    try:
        s = socket.create_connection(("smtp.gmail.com", 587), timeout=5)
        s.close()
        results["port_587"] = {"status": "open"}
    except Exception as e:
        results["port_587"] = {"status": "closed/blocked", "error": str(e)}

    # 4. Gmail API Token check
    gmail_token_present = bool(os.getenv("GMAIL_TOKEN_JSON"))
    token_file_exists = os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "token.json"))
    results["gmail_api"] = {
        "env_token_set": gmail_token_present,
        "local_token_file": token_file_exists,
    }

    # 5. Google OAuth Config check
    results["google_oauth"] = {
        "web_client_id_set": bool(Config.GOOGLE_CLIENT_ID),
        "android_client_id_set": bool(Config.GOOGLE_ANDROID_CLIENT_ID),
    }

    logger.info(f"[DIAG] Network check completed: {results}")
    return jsonify(results), 200

@diag_bp.route("/ai-check", methods=["GET"])
def ai_check():
    """Diagnostic check for AI connectivity."""
    from utils.ai_agent import MealAgent
    agent = MealAgent()
    
    status = {
        "client_initialized": agent.client is not None,
        "api_key_present": agent.api_key is not None and len(agent.api_key) > 0,
        "model": agent.model
    }
    
    if not agent.client:
        status["test_call"] = "skipped (no client)"
        return jsonify(status), 200
        
    try:
        # Simple test call
        response = agent.client.chat.completions.create(
            model=agent.model,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5,
            timeout=5.0
        )
        status["test_call"] = "success"
        status["response_preview"] = response.choices[0].message.content[:20]
    except Exception as e:
        status["test_call"] = "failed"
        status["error"] = str(e)

    logger.info(f"[DIAG] AI check completed: {status}")
    return jsonify(status), 200

@diag_bp.route("/config-check", methods=["GET"])
def config_check():
    """Check critical configuration values are set (no secrets exposed)."""
    config_status = {
        "mongo_uri_set": bool(Config.MONGO_URI and "mongodb" in Config.MONGO_URI),
        "jwt_secret_set": bool(Config.JWT_SECRET_KEY and Config.JWT_SECRET_KEY != "fallback-secret-key"),
        "google_web_client_id_set": bool(Config.GOOGLE_CLIENT_ID),
        "google_android_client_id_set": bool(Config.GOOGLE_ANDROID_CLIENT_ID),
        "frontend_url": Config.FRONTEND_URL,
        "flask_env": os.environ.get("FLASK_ENV", "not set"),
        "is_render": bool(os.environ.get("RENDER")),
        "is_vercel": bool(os.environ.get("VERCEL")),
        "access_token_expires_seconds": int(Config.JWT_ACCESS_TOKEN_EXPIRES.total_seconds()),
        "refresh_token_expires_seconds": int(Config.JWT_REFRESH_TOKEN_EXPIRES.total_seconds()),
    }
    logger.info(f"[DIAG] Config check: {config_status}")
    return jsonify(config_status), 200

@diag_bp.route("/log", methods=["POST"])
def log_client_error():
    """Receive client-side logs/errors and output them to the server console (Render logs)."""
    try:
        data = request.get_json() or {}
        level = data.get("level", "error").lower()
        message = data.get("message", "No message provided")
        context = data.get("context", "unknown")
        device_info = data.get("device_info", {})

        log_msg = f"[CLIENT LOG - {context.upper()}] {message} | Device: {device_info}"

        if level == "debug":
            logger.debug(log_msg)
        elif level == "info":
            logger.info(log_msg)
        elif level == "warning":
            logger.warning(log_msg)
        elif level == "critical":
            logger.critical(log_msg)
        else:
            logger.error(log_msg)

        return jsonify({"status": "logged"}), 200
    except Exception as e:
        logger.error(f"[DIAG ERROR] Failed to process client log: {e}")
        return jsonify({"error": "Failed to log"}), 500

