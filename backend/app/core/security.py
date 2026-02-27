"""
Security utilities – password hashing & JWT token management.
All secrets read from environment variables.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

# ── Password hashing ──────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ── JWT tokens ─────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Raises on failure."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Current-user dependency ───────────────────────────────────────
from fastapi import Request

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency – extracts the current user from the JWT stored in httpOnly cookie.
    Returns the User ORM object.
    """
    token = request.cookies.get("access_token")
    if not token:
        # Check Authorization header as fallback (optional, for dev tools)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    from app.models.user import User  # local import to avoid circular deps

    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # ── Demo Mode Protection ──────────────────────────────────────────
    if user.is_demo and request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        safe_paths = ["/auth/login", "/auth/logout", "/auth/refresh", "/auth/demo-login"]
        if request.url.path not in safe_paths:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Action disabled in Demo mode",
            )

    return user


# ── Owner-only dependency ─────────────────────────────────────────
def require_owner(
    current_user=Depends(get_current_user),
):
    """
    FastAPI dependency – ensures the current user is a workspace Owner.
    Returns 403 Forbidden for staff users.
    """
    from app.utils.enums import UserRole

    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required",
        )
    return current_user
