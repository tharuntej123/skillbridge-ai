import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# If sqlite, we need special connect_args
connect_args = {}

engine = None
SessionLocal = None
Base = declarative_base()


def _build_database_url() -> str:
    return os.getenv("DATABASE_URL") or settings.DATABASE_URL


def _get_engine():
    global engine, SessionLocal
    if engine is None:
        database_url = _build_database_url()
        connect_args = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
        engine = create_engine(database_url, connect_args=connect_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine


def initialize_database():
    engine = _get_engine()
    Base.metadata.create_all(bind=engine)

    if _build_database_url().startswith("sqlite"):
        inspector = inspect(engine)
        if inspector.has_table("users"):
            existing_columns = {column["name"] for column in inspector.get_columns("users")}
            for column_name, column_type in [
                ("google_id", "VARCHAR(255)"),
                ("auth_provider", "VARCHAR(50)"),
                ("name", "VARCHAR(255)"),
                ("profile_picture", "VARCHAR(500)"),
            ]:
                if column_name not in existing_columns:
                    with engine.begin() as connection:
                        connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))


def get_db():
    session_local = _get_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
