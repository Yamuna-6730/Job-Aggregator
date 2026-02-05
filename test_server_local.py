import requests
import json
import sys

BASE_URL = "http://localhost:4000"

def test_health():
    try:
        res = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {res.status_code} - {res.json()}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_chat_real():
    payload = {
        "query": "Hello, are you connected?",
        "mode": "normal"
    }
    try:
        res = requests.post(f"{BASE_URL}/chat", json=payload)
        print("\n--- Real Chat Response (Normal Mode) ---")
        print(json.dumps(res.json(), indent=2))
        if res.status_code != 200:
             print("Error detected!")
    except Exception as e:
        print(f"Chat Request Failed: {e}")

if __name__ == "__main__":
    print("Testing API...")
    test_health()
    test_chat_real()
    print("\nTo test job search, use 'job' mode (uses credits).")
