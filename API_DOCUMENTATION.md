# SkillBridge AI - API Documentation

The backend service is built using FastAPI.

**Base URL**: `http://localhost:8000/api`
**interactive Swagger Docs**: `/docs` (e.g. `http://localhost:8000/docs`)

---

## Authentication

All endpoints except `/auth/register` and `/auth/login` require a JWT Token sent in the headers:
`Authorization: Bearer <your_jwt_token>`

### 1. Register User
- **Endpoint**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "securepassword123",
    "role": "student"
  }
  ```
  *Note: `role` must be either `"student"` or `"freelancer"`.*
- **Response**: `201 Created`
  ```json
  {
    "message": "User registered successfully",
    "user_id": "f5012547-d1cb-402a-9bc5-40742f1f5108",
    "role": "student"
  }
  ```

### 2. Login User
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "student"
  }
  ```

---

## Profile Management

### 1. Get Profile
- **Endpoint**: `GET /profile`
- **Headers**: Authorization required
- **Response**: `200 OK`
  ```json
  {
    "id": "e2f183c5-9db4-4f9e-a0e2-df1138be5a07",
    "user_id": "f5012547-d1cb-402a-9bc5-40742f1f5108",
    "name": "Student",
    "skills": "Python, SQL, HTML",
    "education": "BS in Computer Science",
    "experience": "Internship at TechCorp",
    "resume_filename": "resume.pdf",
    "updated_at": "2026-06-09T22:15:30Z"
  }
  ```

### 2. Update Profile
- **Endpoint**: `PUT /profile`
- **Headers**: Authorization required
- **Request Body**:
  ```json
  {
    "name": "Alex Johnson",
    "skills": "Python, SQL, React, Node.js",
    "education": "BS in Computer Science - Stanford (2025)",
    "experience": "Software Engineering Intern at TechCorp (3 months)"
  }
  ```
- **Response**: `200 OK` (Returns updated profile)

### 3. Upload Resume
- **Endpoint**: `POST /profile/resume`
- **Headers**: Authorization required
- **Request Body**: `multipart/form-data` containing the file field `file`
- **Response**: `200 OK` (Returns updated profile listing the active resume file name)

---

## Job Board Management

### 1. List Jobs
- **Endpoint**: `GET /jobs`
- **Headers**: Authorization required
- **Response**: `200 OK`
  *If logged in as a student, items include a computed match percentage relative to their profile:*
  ```json
  [
    {
      "id": "d0f81a7d-5a2a-43d9-93e1-cfab124896cc",
      "owner_id": "c1a938c5-92b4-4f9e-a0e2-df1138be5a01",
      "title": "React Frontend Developer",
      "description": "Looking for a React developer to build interactive templates...",
      "skills_required": "React, CSS, TypeScript",
      "budget": 1200.00,
      "created_at": "2026-06-09T20:10:00Z",
      "match_percentage": 92
    }
  ]
  ```

### 2. Create Job
- **Endpoint**: `POST /jobs`
- **Headers**: Authorization required (Freelancers only)
- **Request Body**:
  ```json
  {
    "title": "React Frontend Developer",
    "description": "Looking for a React developer to build interactive templates...",
    "skills_required": "React, CSS, TypeScript",
    "budget": 1200.00
  }
  ```
- **Response**: `201 Created` (Returns the new Job record)

### 3. Update Job
- **Endpoint**: `PUT /jobs/{id}`
- **Headers**: Authorization required (Owner Freelancer only)
- **Request Body**: (Same format as Create Job)
- **Response**: `200 OK`

### 4. Delete Job
- **Endpoint**: `DELETE /jobs/{id}`
- **Headers**: Authorization required (Owner Freelancer only)
- **Response**: `204 No Content`

### 5. Apply to Job
- **Endpoint**: `POST /jobs/{id}/apply`
- **Headers**: Authorization required (Students only)
- **Response**: `201 Created`
  ```json
  {
    "id": "3f9821d7-21cb-402a-9bc5-40742f1f5108",
    "job_id": "d0f81a7d-5a2a-43d9-93e1-cfab124896cc",
    "student_id": "f5012547-d1cb-402a-9bc5-40742f1f5108",
    "status": "applied",
    "created_at": "2026-06-09T22:30:00Z"
  }
  ```

### 6. Get Applicants (Employer Dashboard)
- **Endpoint**: `GET /jobs/{id}/applicants`
- **Headers**: Authorization required (Owner Freelancer only)
- **Response**: `200 OK` (Lists application status records including student names)

### 7. Update Application Status (Employer Approval)
- **Endpoint**: `PUT /jobs/applications/{app_id}/status`
- **Headers**: Authorization required (Owner Freelancer only)
- **Request Body**:
  ```json
  {
    "status": "shortlisted"
  }
  ```
  *Status options: `"applied"`, `"shortlisted"`, `"rejected"`.*
- **Response**: `200 OK`

---

## AI & RAG Endpoints

### 1. Match Jobs (Sentence-BERT similarity score matrix)
- **Endpoint**: `POST /ai/match-jobs`
- **Headers**: Authorization required (Students only)
- **Response**: `200 OK`
  ```json
  [
    {
      "job": {
        "id": "d0f81a7d-5a2a-43d9-93e1-cfab124896cc",
        "owner_id": "c1a938c5-92b4-4f9e-a0e2-df1138be5a01",
        "title": "React Frontend Developer",
        "description": "Looking for a React developer to build interactive templates...",
        "skills_required": "React, CSS, TypeScript",
        "budget": 1200.00,
        "created_at": "2026-06-09T20:10:00Z",
        "match_percentage": 92
      },
      "match_percentage": 92,
      "skill_gap": ["TypeScript"]
    }
  ]
  ```

### 2. Career Guidance
- **Endpoint**: `POST /ai/career-guidance`
- **Headers**: Authorization required (Students only)
- **Response**: `200 OK` (Returns Google Gemini suggestions)
  ```json
  {
    "career_paths": ["Frontend Engineer", "Full-Stack Developer", "UI/UX Engineer"],
    "missing_skills": ["TypeScript generics", "Next.js App Router", "Tailwind CSS optimizations"],
    "interview_prep": ["Practice CSS flexbox & grid alignments", "Review React hooks execution cycles"]
  }
  ```

### 3. Resume Feedback
- **Endpoint**: `POST /ai/resume-feedback`
- **Headers**: Authorization required (Students only)
- **Response**: `200 OK` (Returns Gemini ATS evaluation)
  ```json
  {
    "strengths": ["Clear breakdown of skills", "Professional layout"],
    "weaknesses": ["Lacks quantitative metrics", "Brief project descriptions"],
    "ats_suggestions": ["Avoid multi-column tables", "Incorporate target keywords"]
  }
  ```

### 4. Learning Roadmap (RAG-Augmented study planner)
- **Endpoint**: `POST /ai/learning-roadmap`
- **Headers**: Authorization required (Students only)
- **Request Body**:
  ```json
  {
    "goal": "Backend Engineer"
  }
  ```
- **Response**: `200 OK` (Uses RAG to gather course documentation URLs and prompt Gemini for a timeline)
  ```json
  {
    "goal": "Backend Engineer",
    "roadmap": [
      {
        "week": "Week 1: Advanced Python & Database Fundamentals",
        "topics": ["Python OOP", "SQL queries, joins & indexing"],
        "resources": [
          "Official Python Tutorial (https://docs.python.org/3/tutorial/)"
        ]
      }
    ]
  }
  ```

### 5. Semantic Search (FAISS query)
- **Endpoint**: `GET /ai/search?q={query}`
- **Headers**: Authorization required
- **Response**: `200 OK` (Returns list of top 5 jobs sorted by vector similarity)
