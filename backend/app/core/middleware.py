import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

class LogRequestsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        process_time = time.time() - start_time
        
        # Extract context (if available, e.g. from auth middleware if it ran before)
        # Note: Depending on middleware order, user might not be in request.state yet.
        # We'll log basic info for now.
        
        log_msg = (
            f"{request.method} {request.url.path} "
            f"{response.status_code} {process_time:.3f}s"
        )
        
        logger.info(log_msg)
        
        return response
