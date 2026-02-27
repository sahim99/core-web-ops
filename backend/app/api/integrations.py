"""
Integration Health API — with TTL cache + concurrency guard.
Owner-only endpoint to check connectivity status of all integration providers.
"""

import time
import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from app.core.dependencies import require_owner
from app.services.email_service import get_email_provider
from app.services.sms_service import get_sms_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations", tags=["Integrations"])

# ── TTL Cache (concurrency-safe) ─────────────────────────────────
CACHE_TTL = 300  # 5 minutes
_health_cache = {"data": None, "expires_at": 0.0}
_cache_lock = asyncio.Lock()


async def _check_provider_health(name: str, provider):
    """Check a single provider's health with latency measurement."""
    start = time.time()
    try:
        healthy = await provider.health()
        latency_ms = int((time.time() - start) * 1000)
    except Exception as e:
        logger.warning(f"Health check failed for {name}: {e}")
        healthy = False
        latency_ms = int((time.time() - start) * 1000)

    return {
        "healthy": healthy,
        "provider": type(provider).__name__,
        "latency_ms": latency_ms,
        "last_check": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
async def get_health(current_user=Depends(require_owner())):
    """Return cached health status of all integration providers."""
    global _health_cache
    now = time.time()

    # Return cached if valid
    if _health_cache["data"] and now < _health_cache["expires_at"]:
        return _health_cache["data"]

    # Concurrency guard — only one health check at a time
    async with _cache_lock:
        # Double-check after acquiring lock
        if _health_cache["data"] and time.time() < _health_cache["expires_at"]:
            return _health_cache["data"]

        email_provider = get_email_provider()
        sms_provider = get_sms_provider()

        email_health, sms_health = await asyncio.gather(
            _check_provider_health("email", email_provider),
            _check_provider_health("sms", sms_provider),
        )

        result = {
            "email": email_health,
            "sms": sms_health,
        }

        _health_cache["data"] = result
        _health_cache["expires_at"] = time.time() + CACHE_TTL

        return result
