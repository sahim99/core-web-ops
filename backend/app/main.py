"""
Core Web Ops – FastAPI Application Entry Point.
Cloud Run compatible: binds to 0.0.0.0:$PORT.
"""

import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.workspace import Workspace
import app.models  # Ensures all SQLAlchemy models are registered in the mapper registry

from app.core.middleware import LogRequestsMiddleware
from app.core.exception_handlers import http_exception_handler, validation_exception_handler, generic_exception_handler
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.api import auth, onboarding, staff, contacts, inbox, bookings, forms, inventory, alerts, event_logs, dashboard, webhooks, automation, integrations, internal_messages
from app.api import settings as settings_api

app = FastAPI(
    title=settings.APP_NAME,
    description="Unified Operations Platform for Service Businesses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── 1. Middleware ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LogRequestsMiddleware)

# ── 2. Exception Handlers ─────────────────────────────────────────
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ── 3. Routers ────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(staff.router)
app.include_router(contacts.router)
app.include_router(inbox.router)
app.include_router(bookings.router)
app.include_router(forms.router)
app.include_router(inventory.router)
app.include_router(alerts.router)
app.include_router(event_logs.router)
app.include_router(dashboard.router)
app.include_router(webhooks.router)
app.include_router(automation.router)
app.include_router(integrations.router)
app.include_router(internal_messages.router)
app.include_router(settings_api.router)


# ── Health check ──────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Enhanced health check – verifies DB connectivity and workspace count."""
    try:
        db.execute(text("SELECT 1"))
        workspace_count = db.query(Workspace).count()
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "database": "connected",
            "workspaces": workspace_count,
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": settings.APP_NAME,
                "database": str(e),
            },
        )


# ── Dev server ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
