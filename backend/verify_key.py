import os
import requests
from dotenv import load_dotenv

# Try loading from current directory
load_dotenv()

key = os.getenv("NVIDIA_API_KEY")
if not key:
    print("ERROR: NVIDIA_API_KEY not found in .env file.")
    exit(1)

print(f"Testing key starting with: {key[:10]}...")

url = "https://integrate.api.nvidia.com/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
# Using a very small model for testing
data = {
    "model": "meta/llama-3.2-3b-instruct",
    "messages": [{"role": "user", "content": "hi"}],
    "max_tokens": 5
}

try:
    print("Connecting to NVIDIA...")
    response = requests.post(url, headers=headers, json=data, timeout=15)
    if response.status_code == 200:
        print("SUCCESS! Your API key is working perfectly.")
        print(f"AI Response: {response.json()['choices'][0]['message']['content']}")
    else:
        print(f"FAILED with status {response.status_code}")
        print(f"Details: {response.text}")
except Exception as e:
    print(f"NETWORK ERROR: {e}")
