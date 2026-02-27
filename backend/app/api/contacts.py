"""
Contacts API – Full CRUD with CRM contact_type filtering.
Workspace-scoped. Accessible by Owner and Staff.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.utils.enums import ContactType
from app.core.csrf import verify_csrf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("/", response_model=list[ContactResponse])
def list_contacts(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    contact_type: Optional[ContactType] = Query(None, description="Filter by type: customer, provider, vendor"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List contacts with optional search and contact_type filter (for CRM tabs)."""
    query = db.query(Contact).filter(
        Contact.workspace_id == current_user.workspace_id,
        Contact.is_deleted == False,
    )

    if contact_type:
        query = query.filter(Contact.contact_type == contact_type)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Contact.name.ilike(search_term))
            | (Contact.email.ilike(search_term))
            | (Contact.phone.ilike(search_term))
        )

    contacts = query.order_by(Contact.created_at.desc()).offset(skip).limit(limit).all()
    return contacts


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single contact by ID – workspace scoped."""
    contact = (
        db.query(Contact)
        .filter(
            Contact.id == contact_id,
            Contact.workspace_id == current_user.workspace_id,
            Contact.is_deleted == False,
        )
        .first()
    )
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_csrf)])
def create_contact(
    payload: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new contact in the workspace. contact_type required for CRM."""
    contact = Contact(
        **payload.model_dump(),
        workspace_id=current_user.workspace_id,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a contact – workspace scoped."""
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.workspace_id == current_user.workspace_id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contact, key, value)

    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft-delete a contact – workspace scoped."""
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.workspace_id == current_user.workspace_id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    contact.is_deleted = True
    db.commit()
