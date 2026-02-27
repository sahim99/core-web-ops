import time
from fastapi import Request, HTTPException, status

# In-memory store for rate limiting: { "ip_address": [timestamp1, timestamp2, ...] }
# In production with multiple workers/instances, use Redis.
RATE_LIMIT_STORE = {}

def limit_requests(request: Request):
    """
    Dependency to limit requests per IP.
    Default: 60 requests per minute.
    """
    if not request.client or not request.client.host:
        return True # Skip rate limit if usage cannot be tracked

    ip = request.client.host
    now = time.time()
    window = 60  # seconds
    limit = 60   # requests per window

    history = RATE_LIMIT_STORE.get(ip, [])
    
    # Filter out timestamps older than the window
    history = [t for t in history if now - t < window]
    
    if len(history) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

    history.append(now)
    RATE_LIMIT_STORE[ip] = history
    return True
