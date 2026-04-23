import socket
import os
import re

def get_local_ip():
    """Get the local IP address of the machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # We don't actually need to connect to anything, just need to pick an interface
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def update_config_files():
    """Automatically detect IP and update Config.js and .env files."""
    ip = get_local_ip()
    print(f"[IP AUTO-UPDATE] Detected local IP: {ip}")

    # Get the project root directory (assuming this script is in backend/utils/)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(backend_dir)

    # 1. Update mobile_app/src/constants/Config.js
    config_js_path = os.path.join(root_dir, "mobile_app", "src", "constants", "Config.js")
    if os.path.exists(config_js_path):
        try:
            with open(config_js_path, "r") as f:
                content = f.read()
            
            # Regex to find the BASE_URL line
            new_content = re.sub(
                r"BASE_URL:\s*'http://[^:]+:5000/api'",
                f"BASE_URL: 'http://{ip}:5000/api'",
                content
            )
            
            with open(config_js_path, "w") as f:
                f.write(new_content)
            print(f"[IP AUTO-UPDATE] Updated mobile_app Config.js with {ip}")
        except Exception as e:
            print(f"[IP AUTO-UPDATE ERROR] Failed to update Config.js: {e}")
    else:
        print(f"[IP AUTO-UPDATE] Config.js not found at {config_js_path}")

    # 2. Update root .env (for web app)
    root_env_path = os.path.join(root_dir, ".env")
    if os.path.exists(root_env_path):
        try:
            with open(root_env_path, "r") as f:
                lines = f.readlines()
            
            new_lines = []
            updated = False
            for line in lines:
                if line.startswith("VITE_API_URL="):
                    new_lines.append(f"VITE_API_URL=http://{ip}:5000/api\n")
                    updated = True
                else:
                    new_lines.append(line)
            
            if not updated:
                new_lines.append(f"VITE_API_URL=http://{ip}:5000/api\n")

            with open(root_env_path, "w") as f:
                f.writelines(new_lines)
            print(f"[IP AUTO-UPDATE] Updated root .env with {ip}")
        except Exception as e:
            print(f"[IP AUTO-UPDATE ERROR] Failed to update root .env: {e}")

    # 3. Update backend/.env (for FRONTEND_URL if needed)
    backend_env_path = os.path.join(backend_dir, ".env")
    if os.path.exists(backend_env_path):
        try:
            with open(backend_env_path, "r") as f:
                lines = f.readlines()
            
            new_lines = []
            for line in lines:
                if line.startswith("FRONTEND_URL="):
                    new_lines.append(f"FRONTEND_URL=http://{ip}:5173\n")
                else:
                    new_lines.append(line)
            
            with open(backend_env_path, "w") as f:
                f.writelines(new_lines)
            print(f"[IP AUTO-UPDATE] Updated backend .env with {ip}")
        except Exception as e:
            print(f"[IP AUTO-UPDATE ERROR] Failed to update backend .env: {e}")

if __name__ == "__main__":
    update_config_files()
