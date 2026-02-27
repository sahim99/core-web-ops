"""
Booking schemas – Phase 2.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.utils.enums import BookingStatus


class BookingTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 30


class BookingTypeResponse(BookingTypeCreate):
    id: int
    is_active: bool
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    service_name: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    contact_id: int


class BookingCreatePublic(BaseModel):
    service_name: str
    contact_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    workspace_slug: str


class BookingUpdate(BaseModel):
    service_name: Optional[str] = None
    status: Optional[BookingStatus] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    service_name: str
    status: BookingStatus
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    contact_id: int
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True
