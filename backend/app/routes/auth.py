from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.auth.google import build_google_login_redirect_url, exchange_google_code, verify_google_id_token
from app.auth.users import get_or_create_google_user
from app.config import settings
from app.db.session import get_db
from app.models.models import User, Profile
from app.schemas.schemas import UserRegister, UserLogin, Token
from app.services.auth_service import get_password_hash, verify_password, create_access_token_for_user


def _create_token_for_user(user: User) -> Token:
    access_token = create_access_token_for_user(user)
    return Token(access_token=access_token, token_type="bearer", role=user.role)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=dict)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already registered"
        )
        
    # Create new user
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Initialize profile
    name_prefix = user_in.email.split("@")[0].capitalize()
    profile = Profile(
        user_id=user.id,
        name=name_prefix,
        skills="",
        education="",
        experience=""
    )
    db.add(profile)
    db.commit()
    
    return {"message": "User registered successfully", "user_id": user.id, "role": user.role}

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found for this Gmail address",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _create_token_for_user(user)


@router.get("/google/login")
def google_login(role: str = Query(default="student"), request: Request = None):
    state = "google-oauth"
    redirect_url = build_google_login_redirect_url(state=state, role=role)
    response = Response(status_code=302, headers={"location": redirect_url})
    return response


@router.get("/google/callback")
def google_callback(
    code: str | None = None,
    state: str | None = None,
    db: Session = Depends(get_db),
):
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google OAuth callback failed.")

    try:
        token_response = exchange_google_code(code)
        id_token_value = token_response.get("id_token")
        google_payload = verify_google_id_token(id_token_value)
        role = "student"
        if state and ":" in state:
            _, role = state.split(":", 1)
        user = get_or_create_google_user(db, google_payload, role=role)
        token = _create_token_for_user(user)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google authentication failed.") from exc

    frontend_redirect = f"{settings.FRONTEND_URL}/dashboard?{urlencode({'token': token.access_token, 'role': token.role})}"
    return RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
