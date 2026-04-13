import socket
import smtplib
import ssl
from flask import Blueprint, jsonify
from config import Config

diag_bp = Blueprint("diagnostics", __name__, url_prefix="/api/diag")

@diag_bp.route("/network-check", methods=["GET"])
def network_check():
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
        
    # 4. SMTP Auth Check (Port 465)
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=5) as server:
            server.login(Config.SENDER_EMAIL, Config.EMAIL_PASSWORD)
            results["auth_465"] = {"status": "success"}
    except Exception as e:
        results["auth_465"] = {"status": "failed", "error": str(e)}

    return jsonify(results), 200
