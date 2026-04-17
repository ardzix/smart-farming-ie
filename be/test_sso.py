import requests

url = "https://sso.arnatech.id/api/auth/login/"
payload = {
    "email": "test_agent_123@example.com",
    "password": "agent_password",
    "username": "test_agent_123@example.com"
}

try:
    resp = requests.post(url, json=payload)
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
