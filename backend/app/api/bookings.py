import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.booking import Booking
from app.models.contact import Contact
from app.utils.enums import BookingStatus, AutomationEventType
from app.services.event_dispatcher import dispatch_event
from pydantic import BaseModel

router = APIRouter(prefix="/bookings", tags=["Bookings"])
logger = logging.getLogger(__name__)

# ── Schemas ─────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    contact_id: int
    title: str = "New Booking"
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None # Mapped to description for now

class BookingResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    status: BookingStatus
    contact_id: int
    contact_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

def _map_response(b: Booking) -> BookingResponse:
    return BookingResponse(
        id=b.id,
        title=b.title,
        description=b.description,
        start_time=b.start_time,
        end_time=b.end_time,
        status=b.status,
        contact_id=b.contact_id,
        contact_name=b.contact.name if b.contact else "Unknown",
        created_at=b.created_at
    )

# ── API Endpoints ───────────────────────────────────────────────

@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[BookingStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List bookings with optional date range and status filters."""
    query = db.query(Booking).filter(Booking.workspace_id == current_user.workspace_id)

    if status:
        query = query.filter(Booking.status == status)
    
    if start_date:
        query = query.filter(Booking.start_time >= start_date)
    if end_date:
        query = query.filter(Booking.end_time <= end_date)

    bookings = query.order_by(Booking.start_time.asc()).all()
    
    # Enrichment
    results = []
    for b in bookings:
        results.append(_map_response(b))
    return results


@router.post("/", response_model=BookingResponse, status_code=201)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a manual booking (defaults to PENDING)."""
    # Verify contact
    contact = db.query(Contact).filter(
        Contact.id == payload.contact_id, 
        Contact.workspace_id == current_user.workspace_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    booking = Booking(
        workspace_id=current_user.workspace_id,
        contact_id=contact.id,
        title=payload.title,
        description=payload.description or payload.notes,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=BookingStatus.PENDING,
        created_by=current_user.id,
        timezone="UTC"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    return _map_response(booking)


@router.post("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Confirm a booking.
    Strict Rule: Check for overlaps with other CONFIRMED bookings.
    """
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.workspace_id == current_user.workspace_id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatus.CONFIRMED:
        return _map_response(booking)

    # 🛑 OVERLAP CHECK (only if booking has scheduled times)
    if booking.start_time and booking.end_time:
        overlapping = db.query(Booking).filter(
            Booking.workspace_id == current_user.workspace_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < booking.end_time,
            Booking.end_time > booking.start_time,
            Booking.id != booking.id 
        ).first()

        if overlapping:
            raise HTTPException(
                status_code=400, 
                detail=f"Time slot overlap with confirmed booking #{overlapping.id} ({overlapping.title})"
            )

    # ✅ Confirm
    booking.status = BookingStatus.CONFIRMED
    db.commit()

    # 📨 Dispatch Event (Email & Message handled by Dispatcher)
    try:
        dispatch_event(
            workspace_id=current_user.workspace_id,
            event_type=AutomationEventType.BOOKING_CONFIRMED.value,
            reference_id=booking.id,
            db=db,
            payload={
                "contact_email": booking.contact.email if booking.contact else None,
                "contact_name": booking.contact.name if booking.contact else "Unknown",
                "date": booking.start_time.strftime("%Y-%m-%d") if booking.start_time else "TBD",
                "time": booking.start_time.strftime("%H:%M") if booking.start_time else "TBD",
                "booking_title": booking.title
            }
        )
    except Exception as e:
        logger.error(f"Event dispatch failed: {e}")

    db.refresh(booking)
    return _map_response(booking)

@router.delete("/{booking_id}", status_code=204)
def delete_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a booking (Soft Delete via Status)."""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.workspace_id == current_user.workspace_id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = BookingStatus.CANCELLED
    db.commit()
