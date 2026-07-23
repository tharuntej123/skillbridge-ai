import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillBridge AI"
    API_V1_STR: str = "/api"
    
    # Database
    # Fallback to local SQLite if DATABASE_URL is not set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./skillbridge.db")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_SKILLBRIDGE_KEY_1234567890!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    KNOWLEDGE_BASE_PATH: str = os.path.join(BASE_DIR, "data", "learning_resources.json")
    FAISS_INDEX_PATH: str = os.path.join(BASE_DIR, "data", "faiss_jobs.index")

    class Config:
        case_sensitive = True

settings = Settings()
