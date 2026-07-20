import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app


def test_register_and_login_flow():
    client = TestClient(app)
    email = "pytest-user@example.com"
    password = "pytest-pass-123"

    register_resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "role": "student"},
    )
    assert register_resp.status_code == 201, register_resp.text

    login_resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    payload = login_resp.json()
    assert payload["access_token"]
    assert payload["role"] == "student"
