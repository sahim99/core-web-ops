import secrets
from fastapi import Request, HTTPException, status

def generate_csrf_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)

def verify_csrf(request: Request):
    """
    Dependency to verify CSRF token on unsafe methods (POST, PUT, DELETE, PATCH).
    Requires 'X-CSRF-Token' header to match 'csrf_token' cookie.
    """
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return

    cookie_token = request.cookies.get("csrf_token")
    header_token = request.headers.get("X-CSRF-Token")

    if not cookie_token or not header_token or cookie_token != header_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing or invalid"
        )
