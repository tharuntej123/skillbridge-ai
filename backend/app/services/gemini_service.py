import json
import logging
import os
from typing import List, Dict, Any
import google.generativeai as genai
from app.config import settings
from app.services.embedding_service import get_embedding, calculate_similarity

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini API key configured successfully.")
else:
    logger.warning("GEMINI_API_KEY environment variable is not set. Gemini services will operate in demo/mock mode.")

def call_gemini_json(prompt: str, system_instruction: str = "") -> dict:
    """Helper to query Gemini 1.5 Flash in JSON mode."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API Key missing")
        
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"},
            system_instruction=system_instruction
        )
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        raise e

# ----------------- FEATURE A: CAREER GUIDANCE -----------------

def get_career_guidance(profile_data: dict) -> dict:
    """Generates career guidance recommendations for a student."""
    name = profile_data.get("name", "Student")
    skills = profile_data.get("skills", "")
    education = profile_data.get("education", "")
    experience = profile_data.get("experience", "")
    
    prompt = f"""
    Analyze the following student profile:
    Name: {name}
    Skills: {skills}
    Education: {education}
    Experience: {experience}
    
    Provide:
    1. Recommended career paths (list of 3 items).
    2. Missing skills that would help the student achieve these paths (list of 4-5 items).
    3. Interview preparation roadmap steps (list of 4 key action items).
    
    Return a JSON object conforming to this schema:
    {{
      "career_paths": ["string"],
      "missing_skills": ["string"],
      "interview_prep": ["string"]
    }}
    """
    
    system_instruction = "You are a professional technical career counselor. Provide accurate, practical, and highly relevant career suggestions."
    
    if settings.GEMINI_API_KEY:
        try:
            return call_gemini_json(prompt, system_instruction)
        except Exception:
            pass # Fall back to mock response
            
    # Mock Response
    skills_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
    if "python" in skills_list or "django" in skills_list or "fastapi" in skills_list or "sql" in skills_list:
        paths = ["Backend Engineer", "Data Engineer", "Machine Learning Practitioner"]
        missing = ["Docker / Containerization", "Kubernetes", "Advanced PostgreSQL & Query Tuning", "System Design Patterns", "CI/CD Pipelines"]
        prep = ["Review Python OOP & memory management", "Solve SQL coding challenges (joins, window functions)", "Design a tiny URL shortener architecture", "Practice mock behavioral interviews using STAR method"]
    elif "react" in skills_list or "js" in skills_list or "javascript" in skills_list or "css" in skills_list or "html" in skills_list:
        paths = ["Frontend Engineer", "Full-Stack JavaScript Developer", "UI/UX Engineer"]
        missing = ["TypeScript generics", "Next.js App Router & Server Components", "Tailwind CSS optimizations", "State management (Zustand/Redux)", "Web Vitals & Performance profiling"]
        prep = ["Implement debouncing and throttling in JS", "Build and explain a nested comment UI component", "Practice CSS flexbox & grid alignments under pressure", "Review React hooks execution cycles and memoization"]
    else:
        paths = ["Software Developer", "IT Systems Analyst", "Cloud Support Specialist"]
        missing = ["Git & GitHub workflows", "REST API Design concepts", "Data Structures & Algorithms (Trees, Graphs)", "Linux commands & bash scripting", "AWS Cloud Basics"]
        prep = ["Build a complete CRUD API with your chosen language", "Solve LeetCode simple/medium strings & arrays", "Understand Agile methodologies", "Review basic networking & HTTP status codes"]

    return {
        "career_paths": paths,
        "missing_skills": missing,
        "interview_prep": prep
    }

# ----------------- FEATURE B: RESUME FEEDBACK -----------------

def get_resume_feedback(resume_text: str) -> dict:
    """Analyzes resume text and returns strengths, weaknesses, and ATS suggestions."""
    prompt = f"""
    Analyze the following resume text:
    ---
    {resume_text}
    ---
    
    Identify:
    1. Key strengths of the candidate.
    2. Weaknesses or areas for improvement.
    3. ATS (Applicant Tracking System) compatibility suggestions.
    
    Return a JSON object conforming to this schema:
    {{
      "strengths": ["string"],
      "weaknesses": ["string"],
      "ats_suggestions": ["string"]
    }}
    """
    
    system_instruction = "You are an expert recruiter and resume writer. Give constructive, technical feedback that will maximize landing interviews."
    
    if settings.GEMINI_API_KEY:
        try:
            return call_gemini_json(prompt, system_instruction)
        except Exception:
            pass # Fall back to mock response
            
    # Mock Response
    return {
        "strengths": [
            "Good breakdown of technical skills section",
            "Clear mention of core programming languages and frameworks",
            "Professional layout with contact details visible"
        ],
        "weaknesses": [
            "Lacks quantitative impact metrics (e.g. 'improved performance by 30%')",
            "Project descriptions are overly brief and don't detail the architecture",
            "Missing clear summaries of responsibilities in previous experiences"
        ],
        "ats_suggestions": [
            "Avoid multi-column tables which scramble parser reading order",
            "Incorporate more keyword terms directly matching target job descriptions",
            "Ensure file is formatted cleanly with standard section headers like 'Skills', 'Experience', and 'Education'"
        ]
    }

# ----------------- FEATURE C: RAG ROADMAP -----------------

def retrieve_learning_resources(goal: str, student_skills: str) -> List[Dict[str, Any]]:
    """
    RAG step: Retrieves relevant learning resources from our database
    based on the student's career goal and skills.
    """
    try:
        if not os.path.exists(settings.KNOWLEDGE_BASE_PATH):
            return []
            
        with open(settings.KNOWLEDGE_BASE_PATH, "r") as f:
            resources = json.load(f)
    except Exception as e:
        logger.error(f"Error loading knowledge base: {e}")
        return []
        
    query_text = f"Goal: {goal}. Current Skills: {student_skills}."
    query_emb = get_embedding(query_text)
    
    scored_resources = []
    for r in resources:
        r_text = f"Topic: {r['topic']}. Title: {r['title']}. Description: {r['description']}"
        r_emb = get_embedding(r_text)
        similarity = calculate_similarity(query_emb, r_emb)
        scored_resources.append((r, similarity))
        
    # Sort descending
    scored_resources.sort(key=lambda x: x[1], reverse=True)
    
    # Return top 4 matching resources
    return [item[0] for item in scored_resources[:4]]

def generate_learning_roadmap(goal: str, student_skills: str) -> dict:
    """Retrieves context resources and uses Gemini to generate a personalized learning roadmap."""
    # 1. Retrieve relevant resources (RAG)
    resources = retrieve_learning_resources(goal, student_skills)
    
    # Format retrieved resources as prompt context
    context_str = ""
    for r in resources:
        context_str += f"- Title: {r['title']}\n  URL: {r['url']}\n  Description: {r['description']}\n\n"
        
    prompt = f"""
    Generate a personalized weekly learning roadmap for a student.
    Target Career Goal: {goal}
    Current Student Skills: {student_skills}
    
    Use the following verified learning resources in the roadmap where applicable:
    {context_str}
    
    Please design a 4-week roadmap.
    
    Return a JSON object conforming to this schema:
    {{
      "goal": "{goal}",
      "roadmap": [
        {{
          "week": "Week 1: [Topic]",
          "topics": ["sub-topic 1", "sub-topic 2"],
          "resources": ["Include the title and URL of the verified resources, or general study resources if no exact match"]
        }}
      ]
    }}
    """
    
    system_instruction = "You are a professional technical education curator. Create realistic, sequential weekly roadmaps that bridge the skill gaps."
    
    if settings.GEMINI_API_KEY:
        try:
            return call_gemini_json(prompt, system_instruction)
        except Exception:
            pass # Fall back to mock response
            
    # Mock Response generator based on the goal
    goal_lower = goal.lower()
    if "backend" in goal_lower:
        roadmap = [
            {
                "week": "Week 1: Advanced Python & Database Fundamentals",
                "topics": ["Python OOP", "SQL queries, joins & indexing", "Database normalization"],
                "resources": [
                    "Official Python Tutorial (https://docs.python.org/3/tutorial/)",
                    "PostgreSQL Exercises (https://pgexercises.com/)"
                ]
            },
            {
                "week": "Week 2: FastAPI and RESTful APIs",
                "topics": ["Routing, path and query parameters", "Pydantic request validation", "Database integrations with SQLAlchemy"],
                "resources": [
                    "FastAPI Web Framework Documentation (https://fastapi.tiangolo.com/)",
                    "SQLAlchemy ORM Quickstart (https://docs.sqlalchemy.org/)"
                ]
            },
            {
                "week": "Week 3: Containerization & Cloud Deployment",
                "topics": ["Writing Dockerfiles", "Multi-container setups with Docker Compose", "AWS RDS and EC2 setup"],
                "resources": [
                    "AWS Certified Cloud Practitioner Hub (https://aws.amazon.com/certification/certified-cloud-practitioner/)",
                    "Docker Curriculum Guide (https://docker-curriculum.com/)"
                ]
            },
            {
                "week": "Week 4: Algorithms & Interview Practice",
                "topics": ["Complexity analysis (Big O)", "Linked lists, Trees and Graph algorithms", "Mock coding sessions"],
                "resources": [
                    "Leetcode Study Plan - Top Interview 150 (https://leetcode.com/studyplan/top-interview-150/)",
                    "GeeksforGeeks Data Structures & Algorithms (https://www.geeksforgeeks.org/data-structures/)"
                ]
            }
        ]
    elif "frontend" in goal_lower or "react" in goal_lower:
        roadmap = [
            {
                "week": "Week 1: Modern JavaScript & CSS UI Layouts",
                "topics": ["ES6+ Javascript (Promises, Async/Await)", "CSS Flexbox and Grid layouts", "Responsive page design"],
                "resources": [
                    "MDN Web Docs - JavaScript Guide (https://developer.mozilla.org/)",
                    "CSS-Tricks Flexbox & Grid Guides (https://css-tricks.com/)"
                ]
            },
            {
                "week": "Week 2: React Core Hooks & Performance",
                "topics": ["React state management & side effects", "Custom Hooks design", "Memoization & virtualization"],
                "resources": [
                    "React.dev Documentation (https://react.dev/)",
                    "Kent C. Dodds React Blog (https://kentcdodds.com/blog)"
                ]
            },
            {
                "week": "Week 3: Next.js Framework & Layouts",
                "topics": ["Server-Side Components vs Client Components", "Dynamic Routing", "Data fetching models"],
                "resources": [
                    "Next.js App Router Guide (https://nextjs.org/docs)",
                    "Vercel Rendering Best Practices (https://vercel.com/)"
                ]
            },
            {
                "week": "Week 4: Data Structures & System design",
                "topics": ["Standard algorithms (Trees, Sorting)", "Web performance metrics (LCP, FID)", "Interview questions prep"],
                "resources": [
                    "Leetcode Study Plan - Top Interview 150 (https://leetcode.com/studyplan/top-interview-150/)",
                    "GeeksforGeeks Data Structures & Algorithms (https://www.geeksforgeeks.org/data-structures/)"
                ]
            }
        ]
    else:
        roadmap = [
            {
                "week": "Week 1: Fundamental Programming Principles",
                "topics": ["Variable scopes and loops", "Writing clean functions", "Version control with Git"],
                "resources": [
                    "Official Python Tutorial (https://docs.python.org/3/tutorial/)",
                    "Pro Git Book (https://git-scm.com/book/en/v2)"
                ]
            },
            {
                "week": "Week 2: REST APIs & Backend routing",
                "topics": ["HTTP verbs and status codes", "FastAPI basic routers", "Database connections"],
                "resources": [
                    "FastAPI Web Framework Documentation (https://fastapi.tiangolo.com/)"
                ]
            },
            {
                "week": "Week 3: Core DSA & Algorithms",
                "topics": ["Time complexity analysis", "Sorting and searching", "Arrays & Hashes usage"],
                "resources": [
                    "GeeksforGeeks Data Structures & Algorithms (https://www.geeksforgeeks.org/data-structures/)"
                ]
            },
            {
                "week": "Week 4: Cloud infrastructure Basics",
                "topics": ["Cloud service models", "AWS Storage (S3) & Compute (EC2)", "Cloud deployments"],
                "resources": [
                    "AWS Certified Cloud Practitioner Hub (https://aws.amazon.com/certification/certified-cloud-practitioner/)"
                ]
            }
        ]
        
    return {
        "goal": goal,
        "roadmap": roadmap
    }
