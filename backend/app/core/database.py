"""
Database engine, session factory, and dependency.
DATABASE_URL is always read from environment – supports both local
PostgreSQL and Cloud SQL.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=1,       # Cloud Run: 2 workers × 1 = 2 base connections
    max_overflow=2,    # burst up to 3 per worker = 6 max total — safe for Supabase free tier
    pool_timeout=30,
    pool_recycle=1800, # recycle stale connections every 30 min
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
