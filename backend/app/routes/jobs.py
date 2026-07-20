from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import User, Job, Application, Profile
from app.schemas.schemas import JobOut, JobCreate, JobUpdate, ApplicationOut, ApplicationUpdateStatus
from app.middleware.auth import get_current_user, get_current_freelancer, get_current_student
from app.services.embedding_service import calculate_skill_match
from app.services.vector_search import vector_index

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobOut])
def list_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).all()
    
    # If the user is a student, calculate skill match percentages
    if current_user.role == "student":
        profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        student_skills = profile.skills if profile else ""
        
        result_jobs = []
        for job in jobs:
            match_res = calculate_skill_match(student_skills, job.skills_required)
            # Create a JobOut dict with match_percentage
            job_out = JobOut.model_validate(job)
            job_out.match_percentage = match_res["match_percentage"]
            result_jobs.append(job_out)
        return result_jobs
        
    return [JobOut.model_validate(j) for j in jobs]

@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_freelancer),
    db: Session = Depends(get_db)
):
    job = Job(
        owner_id=current_user.id,
        title=job_in.title,
        description=job_in.description,
        skills_required=job_in.skills_required,
        budget=job_in.budget
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Rebuild vector index
    vector_index.rebuild(db)
    
    return job

@router.put("/{id}", response_model=JobOut)
def update_job(
    id: str,
    job_in: JobUpdate,
    current_user: User = Depends(get_current_freelancer),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == id, Job.owner_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
        
    for field, value in job_in.model_dump().items():
        setattr(job, field, value)
        
    db.commit()
    db.refresh(job)
    
    # Rebuild vector index
    vector_index.rebuild(db)
    
    return job

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    id: str,
    current_user: User = Depends(get_current_freelancer),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == id, Job.owner_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
        
    db.delete(job)
    db.commit()
    
    # Rebuild vector index
    vector_index.rebuild(db)
    return None

# ----------------- APPLICATIONS & DASHBOARDS -----------------

@router.post("/{id}/apply", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    id: str,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
        
    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.job_id == id,
        Application.student_id == current_user.id
    ).first()
    
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job"
        )
        
    app = Application(
        job_id=id,
        student_id=current_user.id,
        status="applied"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

@router.get("/posted", response_model=List[JobOut])
def get_posted_jobs(
    current_user: User = Depends(get_current_freelancer),
    db: Session = Depends(get_db)
):
    """Retrieve jobs posted by the freelancer."""
    jobs = db.query(Job).filter(Job.owner_id == current_user.id).all()
    return jobs

@router.get("/applied", response_model=List[ApplicationOut])
def get_applied_jobs(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Retrieve applications submitted by the student."""
    apps = db.query(Application).filter(Application.student_id == current_user.id).all()
    res = []
    for a in apps:
        a_out = ApplicationOut.model_validate(a)
        a_out.job_title = a.job.title
        res.append(a_out)
    return res

@router.get("/{id}/applicants", response_model=List[ApplicationOut])
def get_job_applicants(
    id: str,
    current_user: User = Depends(get_current_freelancer),
    db: Session = Depends(get_db)
):
    """Retrieve all applicants for a specific job posted by this freelancer."""
    job = db.query(Job).filter(Job.id == id, Job.owner_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized"
        )
        
    apps = db.query(Application).filter(Application.job_id == id).all()
    res = []
    for a in apps:
        a_out = ApplicationOut.model_validate(a)
        # Fetch applicant's profile name
        profile = db.query(Profile).filter(Profile.user_id == a.student_id).first()
        a_out.student_name = profile.name if profile else "Student"
        a_out.job_title = job.title
        res.append(a_out)
    return res

@router.put("/applications/{app_id}/status", response_model=ApplicationOut)
def update_application_status(
    app_id: str,
    status_in: ApplicationUpdateStatus,
    current_user: User = Depends(get_current_freelancer),
    db: Session = Depends(get_db)
):
    """Freelancer updates application status (applied, shortlisted, rejected)."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
        
    # Ensure this freelancer owns the job
    if app.job.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this application status"
        )
        
    app.status = status_in.status
    db.commit()
    db.refresh(app)
    
    a_out = ApplicationOut.model_validate(app)
    profile = db.query(Profile).filter(Profile.user_id == app.student_id).first()
    a_out.student_name = profile.name if profile else "Student"
    a_out.job_title = app.job.title
    return a_out
