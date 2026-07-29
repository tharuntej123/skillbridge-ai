import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import Base, SessionLocal, initialize_database
from app.models import models  # noqa: F401  # ensure SQLAlchemy models are registered
from app.routes import auth, profile, jobs, ai
from app.services.vector_search import vector_index

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SkillBridge AI - Freelancing Platform with AI Skill Matching & RAG Learning Roadmaps",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
# Allow local Next.js dev server and production deployments
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "http://[::1]:3000",
    "https://skillbridge-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)

initialize_database()

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database schema...")
    try:
        initialize_database()
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.critical(f"Failed to initialize database: {e}")
        
    logger.info("Building FAISS Vector Index...")
    try:
        db = SessionLocal()
        vector_index.rebuild(db)
        db.close()
        logger.info("FAISS Vector Index initialized.")
    except Exception as e:
        logger.error(f"Failed to build FAISS index on startup: {e}")

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": "connected"
    }
