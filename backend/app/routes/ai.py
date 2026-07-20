from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import User, Profile, Job, SkillMatch, LearningRoadmap
from app.schemas.schemas import (
    SkillMatchResponse, JobOut, CareerGuidanceResponse,
    ResumeFeedbackResponse, LearningRoadmapRequest,
    LearningRoadmapResponse, LearningRoadmapOut
)
from app.middleware.auth import get_current_user, get_current_student
from app.services.embedding_service import calculate_skill_match
from app.services.gemini_service import get_career_guidance, get_resume_feedback, generate_learning_roadmap
from app.services.vector_search import vector_index
import json

router = APIRouter(prefix="/ai", tags=["AI Features"])

@router.post("/match-jobs", response_model=List[SkillMatchResponse])
def match_jobs(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Retrieves all jobs, performs Sentence-BERT skill matching
    against the student's profile, and saves/returns the matching details.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
        
    jobs = db.query(Job).all()
    results = []
    
    # Delete old matches for this student to keep database fresh
    db.query(SkillMatch).filter(SkillMatch.student_id == current_user.id).delete()
    
    for job in jobs:
        match_res = calculate_skill_match(profile.skills, job.skills_required)
        
        # Save to database
        db_match = SkillMatch(
            student_id=current_user.id,
            job_id=job.id,
            match_percentage=match_res["match_percentage"],
            skill_gap=",".join(match_res["skill_gap"])
        )
        db.add(db_match)
        
        # Build response schema
        job_out = JobOut.model_validate(job)
        job_out.match_percentage = match_res["match_percentage"]
        
        results.append(
            SkillMatchResponse(
                job=job_out,
                match_percentage=match_res["match_percentage"],
                skill_gap=match_res["skill_gap"]
            )
        )
        
    db.commit()
    # Sort results by match percentage descending
    results.sort(key=lambda x: x.match_percentage, reverse=True)
    return results


@router.post("/career-guidance", response_model=CareerGuidanceResponse)
def career_guidance(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Uses Google Gemini to analyze student profile and recommend career paths & prep roadmap."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
        
    profile_data = {
        "name": profile.name,
        "skills": profile.skills,
        "education": profile.education,
        "experience": profile.experience
    }
    
    guidance = get_career_guidance(profile_data)
    return guidance


@router.post("/resume-feedback", response_model=ResumeFeedbackResponse)
def resume_feedback(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Analyzes the candidate's uploaded resume using Gemini to provide ATS suggestions."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile or not profile.resume_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text has not been uploaded. Please upload a resume first."
        )
        
    feedback = get_resume_feedback(profile.resume_content)
    return feedback


@router.post("/learning-roadmap", response_model=LearningRoadmapResponse)
def learning_roadmap(
    req: LearningRoadmapRequest,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    RAG Pipeline: Retrieves learning resources matching target goal,
    sends context to Gemini, and generates a structured weekly learning roadmap.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    student_skills = profile.skills if profile else ""
    
    roadmap_data = generate_learning_roadmap(req.goal, student_skills)
    
    # Save the generated roadmap in db
    # Delete previous roadmaps for this student to save space
    db.query(LearningRoadmap).filter(LearningRoadmap.student_id == current_user.id).delete()
    
    db_roadmap = LearningRoadmap(
        student_id=current_user.id,
        goal=req.goal,
        roadmap_json=json.dumps(roadmap_data)
    )
    db.add(db_roadmap)
    db.commit()
    
    return roadmap_data


@router.get("/learning-roadmap/saved", response_model=LearningRoadmapResponse)
def get_saved_learning_roadmap(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Retrieves the latest saved learning roadmap for the student."""
    db_roadmap = db.query(LearningRoadmap).filter(LearningRoadmap.student_id == current_user.id).order_by(LearningRoadmap.created_at.desc()).first()
    if not db_roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No saved roadmap found. Please generate one first."
        )
        
    roadmap_data = json.loads(db_roadmap.roadmap_json)
    return roadmap_data


@router.get("/search", response_model=List[JobOut])
def semantic_search(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Performs a FAISS semantic vector search to find relevant jobs."""
    results = vector_index.search(db, query=q, top_k=5)
    
    # If the user is a student, calculate matching percentage for each search result
    profile = None
    student_skills = ""
    if current_user.role == "student":
        profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        student_skills = profile.skills if profile else ""
        
    search_results = []
    for job, sim_score in results:
        job_out = JobOut.model_validate(job)
        if current_user.role == "student":
            match_res = calculate_skill_match(student_skills, job.skills_required)
            job_out.match_percentage = match_res["match_percentage"]
        else:
            # For freelancers, similarity score is fine
            job_out.match_percentage = int(round(sim_score * 100))
        search_results.append(job_out)
        
    return search_results
