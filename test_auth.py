import requests
import json

try:
    response = requests.post(
        "https://nutritionai.onrender.com/api/auth/login",
        json={"email": "test@test.com", "password": "wrong"},
        timeout=15
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
