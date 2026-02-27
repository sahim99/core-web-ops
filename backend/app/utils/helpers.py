"""
Utility helpers for the Core Web Ops platform.
"""

import re
import secrets
import string
from datetime import datetime, timezone


def generate_slug(name: str) -> str:
    """Generate a URL-safe slug from a name."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    # Append a short random suffix for uniqueness
    suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    return f"{slug}-{suffix}"


def utc_now() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def sanitize_string(value: str) -> str:
    """Strip and collapse whitespace in a string."""
    if not value:
        return value
    return re.sub(r"\s+", " ", value.strip())


def generate_staff_id(first_name: str, db) -> str:
    """
    Generate a unique staff ID: lowercase_first_name + 5_digits + 1_letter.
    Example: 'rahim48293k'
    Loops until a unique ID is found in the database.
    """
    from app.models.user import User  # local import to avoid circular deps

    # Clean: lowercase, remove spaces/special chars, take first name only
    base_name = re.sub(r"[^a-z]", "", first_name.lower().split()[0] if first_name.strip() else "staff")
    if not base_name:
        base_name = "staff"

    for _ in range(100):  # safety limit
        random_digits = "".join(secrets.choice(string.digits) for _ in range(5))
        random_letter = secrets.choice(string.ascii_uppercase)
        # Combine parts: UPPERCASE_NAME + 5DIGITS + 1LETTER
        candidate_id = f"{base_name.upper()}{random_digits}{random_letter}"
        
        # Check uniqueness against DB
        exists = db.query(User).filter(User.staff_id == candidate_id).first()
        if not exists:
            return candidate_id

    raise RuntimeError("Failed to generate unique staff_id after 100 attempts")
