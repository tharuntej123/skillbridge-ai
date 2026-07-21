import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app


def test_register_and_login_flow():
    client = TestClient(app)
    email = "pytest-user-unique-2@gmail.com"
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


def test_rejects_non_gmail_registration():
    client = TestClient(app)

    response = client.post(
        "/api/auth/register",
        json={"email": "pytest-user@example.com", "password": "pytest-pass-123", "role": "student"},
    )

    assert response.status_code == 422, response.text


def test_login_requires_registered_gmail_account():
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"email": "missing-user@gmail.com", "password": "anything"},
    )

    assert response.status_code == 401, response.text
    assert "No account found" in response.text
