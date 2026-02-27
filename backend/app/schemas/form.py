"""
Form schemas – dynamic forms with fields, submissions, and answers.
"""

from pydantic import BaseModel, computed_field
from typing import Optional, Any
from datetime import datetime
from app.core.config import settings

from app.utils.enums import FormPurpose, FormStatus, SubmissionStatus, FieldType


# ── Form Field schemas ──────────────────────────────────────────

class FormFieldCreate(BaseModel):
    label: str
    field_type: FieldType = FieldType.TEXT
    required: bool = False
    field_order: int = 0
    options: Optional[list[str]] = None  # for select fields


class FormFieldUpdate(BaseModel):
    label: Optional[str] = None
    field_type: Optional[FieldType] = None
    required: Optional[bool] = None
    field_order: Optional[int] = None
    options: Optional[list[str]] = None


class FormFieldResponse(BaseModel):
    id: int
    form_id: int
    label: str
    field_type: FieldType
    required: bool
    field_order: int
    options: Optional[list[str]]

    class Config:
        from_attributes = True


# ── Form schemas ────────────────────────────────────────────────

class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    purpose: FormPurpose = FormPurpose.CUSTOM
    fields: Optional[list[FormFieldCreate]] = None  # create fields inline


class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    purpose: Optional[FormPurpose] = None
    status: Optional[FormStatus] = None


class FormResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    purpose: Optional[FormPurpose]
    status: Optional[FormStatus]
    public_slug: Optional[str]
    workspace_id: int
    created_at: datetime
    fields: list[FormFieldResponse] = []

    @computed_field
    def public_url(self) -> str | None:
        if self.public_slug:
             # Use frontend URL if available, otherwise fallback
            base = settings.FRONTEND_URL if hasattr(settings, "FRONTEND_URL") else "http://localhost:5173"
            return f"{base}/f/{self.public_slug}"
        return None

    class Config:
        from_attributes = True


class FormListResponse(BaseModel):
    """Lightweight form for list views (no fields)."""
    id: int
    title: str
    description: Optional[str]
    purpose: Optional[FormPurpose]
    status: Optional[FormStatus]
    public_slug: Optional[str]
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Form Answer schemas ─────────────────────────────────────────

class FormAnswerResponse(BaseModel):
    id: int
    field_id: int
    value: Optional[str]
    field_label: Optional[str] = None
    field_type: Optional[FieldType] = None

    class Config:
        from_attributes = True


# ── Form Submission schemas ─────────────────────────────────────

class FormSubmissionCreate(BaseModel):
    """Public submission – no auth required. Dynamic answers dict."""
    answers: dict[str, Any]  # field_id -> value
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class FormSubmissionResponse(BaseModel):
    id: int
    form_id: int
    contact_id: Optional[int]
    status: Optional[SubmissionStatus]
    workspace_id: int
    created_at: datetime
    answers: list[FormAnswerResponse] = []
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None

    class Config:
        from_attributes = True


# ── Public Form schema (for rendering) ──────────────────────────

class PublicFormResponse(BaseModel):
    """Public-facing form data for rendering (no auth needed)."""
    id: int
    title: str
    description: Optional[str]
    purpose: Optional[FormPurpose]
    fields: list[FormFieldResponse] = []

    class Config:
        from_attributes = True
