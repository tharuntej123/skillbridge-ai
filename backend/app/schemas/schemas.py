from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


def validate_gmail_email(value: str) -> str:
    email = str(value).strip().lower()
    if not email.endswith("@gmail.com"):
        raise ValueError("Only Gmail addresses are allowed")
    return email

# ----------------- AUTH SCHEMAS -----------------

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(student|freelancer)$")

    @field_validator("email")
    @classmethod
    def validate_email_domain(cls, value: EmailStr) -> str:
        return validate_gmail_email(value)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_domain(cls, value: EmailStr) -> str:
        return validate_gmail_email(value)

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[str] = None

# ----------------- PROFILE SCHEMAS -----------------

class ProfileBase(BaseModel):
    name: str
    skills: Optional[str] = None  # Comma-separated
    education: Optional[str] = None
    experience: Optional[str] = None
    resume_filename: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    resume_content: Optional[str] = None

class ProfileOut(ProfileBase):
    id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- JOB SCHEMAS -----------------

class JobBase(BaseModel):
    title: str
    description: str
    skills_required: str  # Comma-separated
    budget: Decimal

class JobCreate(JobBase):
    pass

class JobUpdate(JobBase):
    pass

class JobOut(JobBase):
    id: str
    owner_id: str
    created_at: datetime
    match_percentage: Optional[int] = None

    class Config:
        from_attributes = True

# ----------------- APPLICATION SCHEMAS -----------------

class ApplicationBase(BaseModel):
    job_id: str

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(applied|shortlisted|rejected)$")

class ApplicationOut(BaseModel):
    id: str
    job_id: str
    student_id: str
    status: str
    created_at: datetime
    job_title: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- SKILL MATCH SCHEMAS -----------------

class SkillMatchOut(BaseModel):
    id: str
    student_id: str
    job_id: str
    match_percentage: int
    skill_gap: Optional[str] = None
    calculated_at: datetime

    class Config:
        from_attributes = True

class SkillMatchResponse(BaseModel):
    job: JobOut
    match_percentage: int
    skill_gap: List[str]

# ----------------- AI FEATURE SCHEMAS -----------------

class CareerGuidanceRequest(BaseModel):
    pass  # Uses skills and experience from the current user's profile

class CareerGuidanceResponse(BaseModel):
    career_paths: List[str]
    missing_skills: List[str]
    interview_prep: List[str]

class ResumeFeedbackResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    ats_suggestions: List[str]

class LearningRoadmapRequest(BaseModel):
    goal: str = Field(..., description="e.g. Backend Engineer, React Developer")

class RoadmapWeek(BaseModel):
    week: str
    topics: List[str]
    resources: List[str]

class LearningRoadmapResponse(BaseModel):
    goal: str
    roadmap: List[RoadmapWeek]

class LearningRoadmapOut(BaseModel):
    id: str
    student_id: str
    goal: str
    roadmap_json: str
    created_at: datetime

    class Config:
        from_attributes = True
