import sys
import time
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api"

def make_request(url, method="GET", headers=None, data=None):
    """Utility to make HTTP requests using Python's standard library."""
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(f"{BASE_URL}{url}", data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            if response.status == 204:
                return None
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
            print(f"Error [{e.code}]: {err_json.get('detail', err_body)}")
        except Exception:
            print(f"Error [{e.code}]: {err_body}")
        raise e
    except Exception as e:
        print(f"Connection failed: {e}")
        raise e

def run_integration_test():
    print("=" * 60)
    print("SkillBridge AI - API Workflow Integration Test")
    print("=" * 60)
    
    # 1. Health check
    print("\n[1] Checking backend health status...")
    try:
        # FastAPI health check is on root of API
        req = urllib.request.urlopen("http://localhost:8000/health")
        health = json.loads(req.read().decode("utf-8"))
        print(f"Status: {health['status']}, Project: {health['project']}")
    except Exception:
        print("[-] Backend is not running! Please start the FastAPI backend on port 8000 first:")
        print("    cd backend")
        print("    .\\venv\\Scripts\\activate")
        print("    uvicorn app.main:app --reload --port 8000")
        return

    # Generate unique test emails to avoid conflicts
    timestamp = int(time.time())
    student_email = f"student_{timestamp}@example.com"
    freelancer_email = f"employer_{timestamp}@example.com"
    password = "testpassword123"

    # 2. Register Student
    print(f"\n[2] Registering a new student: {student_email}...")
    student_reg = make_request("/auth/register", "POST", data={
        "email": student_email,
        "password": password,
        "role": "student"
    })
    print(f"Student Registered! User ID: {student_reg['user_id']}")

    # 3. Register Freelancer
    print(f"\n[3] Registering a new freelancer/employer: {freelancer_email}...")
    employer_reg = make_request("/auth/register", "POST", data={
        "email": freelancer_email,
        "password": password,
        "role": "freelancer"
    })
    print(f"Freelancer Registered! User ID: {employer_reg['user_id']}")

    # 4. Login Student to get token
    print(f"\n[4] Logging in student to retrieve JWT token...")
    student_token_res = make_request("/auth/login", "POST", data={
        "email": student_email,
        "password": password
    })
    student_token = student_token_res["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("JWT Token acquired successfully.")

    # 5. Login Freelancer to get token
    print(f"\n[5] Logging in freelancer to retrieve JWT token...")
    employer_token_res = make_request("/auth/login", "POST", data={
        "email": freelancer_email,
        "password": password
    })
    employer_token = employer_token_res["access_token"]
    employer_headers = {"Authorization": f"Bearer {employer_token}"}
    print("JWT Token acquired successfully.")

    # 6. Update Student Profile skills
    print(f"\n[6] Updating student profile with skills (Python, SQL)...")
    profile = make_request("/profile", "PUT", headers=student_headers, data={
        "name": "Jane Doe",
        "skills": "Python, SQL",
        "education": "BS Computer Science",
        "experience": "Academic Python projects"
    })
    print(f"Profile updated. Skills identified in database: {profile['skills']}")

    # 7. Post a job from Freelancer
    print(f"\n[7] Posting a new contract job as Freelancer...")
    job = make_request("/jobs", "POST", headers=employer_headers, data={
        "title": "FastAPI Web Developer",
        "description": "Build high-performance web APIs using FastAPI, PostgreSQL, and Docker containerization.",
        "skills_required": "FastAPI, PostgreSQL, Docker, Python, SQL",
        "budget": 1800.00
    })
    job_id = job["id"]
    print(f"Job posted! Title: '{job['title']}', Budget: ${job['budget']}, Job ID: {job_id}")

    # 8. Semantic search matching using FAISS
    print(f"\n[8] Running FAISS semantic search for query: 'python database web dev'...")
    search_results = make_request(f"/ai/search?q={urllib.parse.quote('python database web dev')}", "GET", headers=student_headers)
    print(f"Search results found: {len(search_results)}")
    for i, res in enumerate(search_results):
        print(f"  {i+1}. {res['title']} - Match Ratio: {res.get('match_percentage')}%")

    # 9. Cosine Similarity matching
    print(f"\n[9] Running Sentence-BERT skill matching for Jane Doe against jobs...")
    matches = make_request("/ai/match-jobs", "POST", headers=student_headers)
    for m in matches:
        print(f"  Job: {m['job']['title']}")
        print(f"  Match Percentage: {m['match_percentage']}%")
        print(f"  Gaps identified: {m['skill_gap']}")

    # 10. Generate Learning Roadmap using RAG and Gemini fallback
    print(f"\n[10] Running RAG Learning Roadmap pipeline for career goal: 'Backend Engineer'...")
    roadmap = make_request("/ai/learning-roadmap", "POST", headers=student_headers, data={
        "goal": "Backend Engineer"
    })
    print(f"Roadmap generated successfully for goal: {roadmap['goal']}")
    for week in roadmap["roadmap"]:
        print(f"  * {week['week']}")
        print(f"    Topics: {', '.join(week['topics'])}")
        print(f"    Resources: {', '.join(week['resources'])}")
        
    print("\n" + "=" * 60)
    print("Integration Test Completed Successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_integration_test()
