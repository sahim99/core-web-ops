"""Webhooks API – stub for Phase 3."""

from fastapi import APIRouter, Depends
from app.core.rate_limit import limit_requests

router = APIRouter(prefix="/webhooks", tags=["Webhooks"], dependencies=[Depends(limit_requests)])


# Endpoints will be implemented in Phase 3
