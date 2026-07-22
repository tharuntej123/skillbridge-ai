# SkillBridge AI - Freelancing Platform with AI Skill Matching

SkillBridge AI is a production-ready MVP designed to bridge the gap between education and freelancing. It helps students and learners discover contracts using AI-powered skill matching, semantic vector search, and custom learning roadmaps generated via Retrieval-Augmented Generation (RAG).

## Core Features

1. **Dual Role Portals**: Dedicated student (learner) and freelancer (employer) pipelines.
2. **AI Skill Matching**: Generates sentence embeddings of student profiles and job descriptions via Sentence-BERT, returning a precise similarity match ratio.
3. **FAISS Semantic Search**: Queries jobs based on vector representation and query intent (e.g., searching for "AI developer" matches related ML descriptions).
4. **Google Gemini Career Counsel**: Performs Gemini API reviews of student profiles to suggest career targets, missing skills, and interview prep.
5. **ATS Resume Scanner**: Evaluates uploaded resumes to score strengths, structural weaknesses, and keyword optimization.
6. **RAG Learning Roadmap**: Queries a database of learning resources to extract matching tutorials, then prompts Gemini to output a sequential study plan.

---

## Tech Stack

*   **Frontend**: Next.js 15, React 19 (RC), TypeScript, Tailwind CSS, Lucide Icons.
*   **Backend**: FastAPI, Python 3.11, Pydantic, SQLAlchemy.
*   **Database**: PostgreSQL (Default) or SQLite (Local fallback).
*   **Vector Search & AI**: Sentence-Transformers (`all-MiniLM-L6-v2`), FAISS, Google Gemini API.
*   **Containers**: Docker, Docker Compose.

---

## Folder Structure

```
skillbridge-ai/
├── backend/
│   ├── app/
│   │   ├── config.py           # App Configurations (Pydantic-Settings)
│   │   ├── main.py             # FastAPI Server Entrypoint
│   │   ├── db/                 # DB Session configuration
│   │   ├── middleware/         # Auth JWT checker & roles verification
│   │   ├── models/             # SQLAlchemy Database Tables
│   │   ├── routes/             # Routes (Auth, Profile, Jobs, AI)
│   │   ├── schemas/            # Request/Response validation schemas
│   │   └── services/           # Services (Embeddings, Gemini, FAISS Vector index)
│   ├── data/
│   │   └── learning_resources.json  # RAG knowledge base
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                    # Next.js 15 App router pages
│   ├── components/             # Shared UI components (Navbar)
│   ├── lib/                    # API client (localStorage JWT, fetch) and styling helpers
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.example
├── docker-compose.yml
├── API_DOCUMENTATION.md
└── README.md
```

---

## Local Setup

### Prerequisite
*   Node.js v20+
*   Python 3.11+
*   Google Gemini API Key (optional, mock fallback is provided out-of-the-box)

### Running the Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On MacOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    ```bash
    cp .env.example .env
    ```
    *Open `.env` and set `GEMINI_API_KEY="your-api-key"` if you have one.*
5.  Launch the FastAPI server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    *The server runs on `http://localhost:8000`. Database tables will be automatically created in `skillbridge.db` on startup.*

### Running the Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Configure variables:
    ```bash
    cp .env.example .env.local
    ```
4.  Run Next.js in development mode:
    ```bash
    npm run dev
    ```
    *The web application is now available at `http://localhost:3000`.*

---

## Running with Docker Compose

If you have Docker installed, you can spin up the entire stack with a single command:

1.  In the root folder, run:
    ```bash
    docker-compose up --build
    ```
2.  Open `http://localhost:3000` to interact with the platform.

---

## Deployment Instructions

### 1. Database (Neon PostgreSQL)
1.  Sign up at [Neon.tech](https://neon.tech/) and create a new serverless PostgreSQL database.
2.  Copy the connection string (with SSL mode enabled):
    `postgresql://<user>:<password>@<host>/<database>?sslmode=require`

### 2. Backend (Render)
1.  Create a Web Service on [Render](https://render.com/).
2.  Link your GitHub repository containing the backend code.
3.  Configure the build configurations:
    *   **Environment**: Python
    *   **Root Directory**: `backend`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4.  Add the following Environment Variables under Settings:
    *   `DATABASE_URL`: *your Neon PostgreSQL connection string*
    *   `GEMINI_API_KEY`: *your Google Gemini key*
    *   `SECRET_KEY`: *a strong secret phrase*

### 3. Frontend (Vercel)
1.  Connect your repository to [Vercel](https://vercel.com/).
2.  Select the project configuration:
    *   **Framework Preset**: Next.js
    *   **Root Directory**: `frontend`
3.  Configure Environment Variables:
    *   `NEXT_PUBLIC_API_URL`: `https://your-backend-service.onrender.com/api`
4.  Click **Deploy**.

## Authentication Improvements

- Improved login validation
- Updated authentication API