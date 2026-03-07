"""
Standalone Demo Data Seeder Script
====================================
Creates the demo workspace and user if they don't exist, then seeds
realistic business data across all modules using the existing seeder
in app.services.demo_seeder.

Usage:
    cd backend
    python -m scripts.seed_demo_data

Can also be imported and called from application startup.
"""

import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.workspace import Workspace
from app.services.demo_seeder import seed_demo_data
from app.utils.enums import UserRole, WorkspaceStatus
import app.models  # register all models

DEMO_EMAIL = "demo@corewebops.com"
DEMO_PASSWORD = "DemoUser@2024!"


def run_seed():
    """Create demo workspace + user if missing, then seed data."""
    db: Session = SessionLocal()
    try:
        # Check if demo user exists
        user = db.query(User).filter(
            User.email == DEMO_EMAIL,
            User.is_demo == True,
            User.is_deleted == False,
        ).first()

        if not user:
            print("[seed] Demo user not found — creating workspace + user…")
            workspace = Workspace(
                name="Rivera & Co.",
                slug="rivera-co-demo",
                status=WorkspaceStatus.ACTIVE,
            )
            db.add(workspace)
            db.flush()

            user = User(
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                full_name="Alex Rivera",
                role=UserRole.OWNER,
                workspace_id=workspace.id,
                is_active=True,
                is_demo=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[seed] Created demo user id={user.id}, workspace id={workspace.id}")
        else:
            print(f"[seed] Demo user already exists: id={user.id}, workspace_id={user.workspace_id}")

        # Seed data idempotently
        print("[seed] Running demo data seeder…")
        seed_demo_data(db, workspace_id=user.workspace_id, owner_id=user.id)
        print("[seed] Demo data seeding complete ✓")

    except Exception as e:
        db.rollback()
        print(f"[seed] ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
