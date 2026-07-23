import os
from typing import Any, Dict
from urllib.parse import urlencode

import requests
from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


def _get_google_redirect_uri() -> str:
    return settings.GOOGLE_REDIRECT_URI or f"{settings.BACKEND_URL}/api/auth/google/callback"


def _get_google_client_id() -> str:
    return settings.GOOGLE_CLIENT_ID or ""


def build_google_login_redirect_url(state: str, role: str = "student") -> str:
    if not _get_google_client_id():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server.",
        )

    params = {
        "client_id": _get_google_client_id(),
        "redirect_uri": _get_google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": f"{state}:{role}" if role else state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_google_code(code: str) -> Dict[str, Any]:
    if not _get_google_client_id() or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth credentials are not configured.",
        )

    payload = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": _get_google_redirect_uri(),
        "grant_type": "authorization_code",
    }

    response = requests.post(GOOGLE_TOKEN_URL, data=payload, timeout=10)
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication failed while exchanging the authorization code.",
        )

    token_data = response.json()
    id_token_value = token_data.get("id_token")
    if not id_token_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google did not return an ID token.",
        )

    return token_data


def verify_google_id_token(id_token_value: str) -> Dict[str, Any]:
    try:
        payload = id_token.verify_oauth2_token(
            id_token_value,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID,
        )
    except Exception as exc:  # pragma: no cover - exercised in runtime
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google token.",
        ) from exc

    if payload.get("iss") not in {"https://accounts.google.com", "accounts.google.com"}:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unexpected Google issuer.")

    if payload.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unexpected Google audience.")

    if payload.get("email_verified") is not True:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email is not verified.")

    return payload
