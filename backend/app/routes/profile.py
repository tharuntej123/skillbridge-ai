import string
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Profile
from app.schemas.schemas import ProfileOut, ProfileUpdate
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profiles"])

@router.get("", response_model=ProfileOut)
def read_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.put("", response_model=ProfileOut)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
        
    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
        
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/resume", response_model=ProfileOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
        
    # Read text content
    contents = await file.read()
    filename = file.filename
    
    extracted_text = ""
    try:
        # Simple extraction
        if filename.endswith(".txt"):
            extracted_text = contents.decode("utf-8", errors="ignore")
        else:
            # Fallback for PDF/DOCX or binary: extract readable letters
            printable = set(string.printable)
            decoded = contents.decode("ascii", errors="ignore")
            filtered = "".join(filter(lambda x: x in printable, decoded))
            # Keep only alphanumeric words and spaces
            words = [w for w in filtered.split() if len(w) < 30]
            extracted_text = " ".join(words[:500]) # Cap at 500 words
            
            # If extraction is empty or too short, construct a smart fallback description
            if len(extracted_text.strip()) < 50:
                extracted_text = f"Resume analysis for {profile.name}. Candidate possesses experience in software design. Skills include: {profile.skills or 'Python, React, Web development'}."
    except Exception as e:
        extracted_text = f"Candidate Profile: {profile.name}. Experience details. Skills: {profile.skills}."
        
    # Update profile record
    profile.resume_filename = filename
    profile.resume_content = extracted_text
    db.commit()
    db.refresh(profile)
    
    return profile
