import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.models import User


def test_google_login_redirects_to_google_oauth(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

    client = TestClient(app)
    response = client.get("/api/auth/google/login", params={"role": "student"}, follow_redirects=False)

    assert response.status_code in {302, 307}
    location = response.headers["location"]
    assert "accounts.google.com/o/oauth2/v2/auth" in location
    assert "response_type=code" in location
    assert "state=" in location


def test_google_callback_creates_user_and_returns_token(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

    from app.auth.google import verify_google_id_token

    def fake_verify_google_id_token(token: str):
        return {
            "sub": "google-user-123",
            "email": "oauth.user@gmail.com",
            "name": "OAuth User",
            "picture": "https://example.com/avatar.png",
            "email_verified": True,
        }

    monkeypatch.setattr("app.auth.google.verify_google_id_token", fake_verify_google_id_token)

    db = SessionLocal()
    existing = db.query(User).filter(User.email == "oauth.user@gmail.com").first()
    if existing:
        db.delete(existing)
        db.commit()
    db.close()

    client = TestClient(app)
    response = client.get(
        "/api/auth/google/callback",
        params={"code": "dummy-code", "state": "ignored-in-test"},
        follow_redirects=False,
    )

    assert response.status_code in {302, 307}
    assert "/dashboard" in response.headers["location"] or "token=" in response.headers["location"]
    db = SessionLocal()
    created_user = db.query(User).filter(User.email == "oauth.user@gmail.com").first()
    assert created_user is not None
    assert created_user.google_id == "google-user-123"
    assert created_user.auth_provider == "google"
    db.close()
