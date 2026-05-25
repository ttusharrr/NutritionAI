import requests
import json

try:
    headers = {
        "Origin": "https://nutritionai.onrender.com",
        "Access-Control-Request-Method": "POST"
    }
    response = requests.options(
        "https://nutritionai.onrender.com/api/auth/login",
        headers=headers,
        timeout=15
    )
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
except Exception as e:
    print(f"Request failed: {e}")
