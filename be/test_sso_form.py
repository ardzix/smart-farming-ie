import requests

url = "https://sso.arnatech.id/api/auth/login/"
payload = {
    "email": "test_agent_123@example.com",
    "password": "agent_password",
    "username": "test_agent_123@example.com"
}
try:
    resp = requests.post(url, data=payload) # Form-encoded instead of JSON
    print(f"Form-Encoded Status Code: {resp.status_code}")
    print(f"Form-Encoded Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
