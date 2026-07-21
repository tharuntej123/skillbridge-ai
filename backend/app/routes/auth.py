from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Profile
from app.schemas.schemas import UserRegister, UserLogin, Token
from app.services.auth_service import get_password_hash, verify_password, create_access_token


def _create_token_for_user(user: User) -> Token:
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role}
    )
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


@router.post("/google", response_model=Token)
def google_auth(email: str, role: str = "student", db: Session = Depends(get_db)):
    normalized_email = email.strip().lower()
    if not normalized_email.endswith("@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Gmail accounts are supported"
        )

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        hashed_pwd = get_password_hash("google-signin")
        user = User(email=normalized_email, hashed_password=hashed_pwd, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = Profile(user_id=user.id, name=normalized_email.split("@", 1)[0].capitalize(), skills="", education="", experience="")
        db.add(profile)
        db.commit()

    return _create_token_for_user(user)
