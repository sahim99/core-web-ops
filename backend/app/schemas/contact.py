"""
Contact schemas – supports contact_type for CRM categorization.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.utils.enums import ContactSource, ContactType


class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: ContactSource = ContactSource.MANUAL
    contact_type: ContactType = ContactType.CUSTOMER
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[ContactSource] = None
    contact_type: Optional[ContactType] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    source: ContactSource
    contact_type: ContactType
    notes: Optional[str]
    workspace_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
