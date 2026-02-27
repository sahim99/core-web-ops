"""
Auth schemas – registration, login, token, user response.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.utils.enums import UserRole, WorkspaceStatus


# ── Requests ───────────────────────────────────────────────────────
class PermissionsPayload(BaseModel):
    inbox: bool = False
    bookings: bool = False
    forms: bool = False
    inventory: bool = False

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20, pattern=r"^\+?[0-9]{10,15}$")
    workspace_name: str = Field(..., min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class StaffLogin(BaseModel):
    """Staff login requires staff_id + email + password."""
    staff_id: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str


class StaffCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20, pattern=r"^\+?[0-9]{10,15}$")
    permissions: PermissionsPayload = PermissionsPayload()


# ── Responses ──────────────────────────────────────────────────────
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    workspace_id: int
    workspace_status: Optional[WorkspaceStatus] = None
    is_active: bool
    is_demo: bool = False
    created_at: datetime
    permissions: Optional[PermissionsPayload] = None
    staff_id: Optional[str] = None
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenWithUser(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
