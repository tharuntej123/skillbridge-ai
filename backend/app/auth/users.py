from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import Profile, User
from app.services.auth_service import get_password_hash


def get_or_create_google_user(db: Session, google_payload: dict, role: str = "student") -> User:
    email = str(google_payload.get("email") or "").strip().lower()
    google_id = str(google_payload.get("sub") or "")
    name = str(google_payload.get("name") or email.split("@", 1)[0].capitalize())
    picture = google_payload.get("picture")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        existing_user.google_id = google_id
        existing_user.auth_provider = "google"
        existing_user.name = name
        existing_user.profile_picture = picture
        if not existing_user.role:
            existing_user.role = role
        db.commit()
        db.refresh(existing_user)
        return existing_user

    user = User(
        email=email,
        hashed_password=get_password_hash("google-signin"),
        role=role,
        google_id=google_id,
        auth_provider="google",
        name=name,
        profile_picture=picture,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        name=name,
        skills="",
        education="",
        experience="",
    )
    db.add(profile)
    db.commit()
    return user
