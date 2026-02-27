"""
Forms API – Dynamic form builder with public submission.
Owner/Staff manage forms + fields; public users submit without auth.
"""

import logging
import secrets
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.dependencies import require_permission
from app.models.user import User
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.form import Form, FormSubmission
from app.models.form_field import FormField
from app.models.form_answer import FormAnswer
from app.schemas.form import (
    FormCreate, FormUpdate, FormResponse, FormListResponse,
    FormFieldCreate, FormFieldUpdate, FormFieldResponse,
    FormSubmissionCreate, FormSubmissionResponse, FormAnswerResponse,
    PublicFormResponse,
)
from app.utils.enums import (
    FormStatus, FormPurpose, SubmissionStatus,
    ContactSource, ContactType, SenderType, MessageType,
    ConversationChannel, AutomationEventType, FieldType,
)
from app.services.event_dispatcher import dispatch_event
from app.core.csrf import verify_csrf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forms", tags=["Forms"])


# ── Helpers ──────────────────────────────────────────────────────

def _generate_slug(title: str, form_id: int = None) -> str:
    """Generate a URL-safe slug from title."""
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    slug = slug[:30]
    random_suffix = secrets.token_hex(3)
    return f"{slug}-{random_suffix}" if not form_id else f"{slug}-{form_id}"


def _get_form_or_404(db: Session, form_id: int, workspace_id: int) -> Form:
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.workspace_id == workspace_id,
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def _build_submission_response(sub: FormSubmission) -> dict:
    """Build a submission response with answers and contact info."""
    answers = []
    for a in sub.answers:
        answers.append(FormAnswerResponse(
            id=a.id,
            field_id=a.field_id,
            value=a.value,
            field_label=a.field.label if a.field else None,
            field_type=a.field.field_type if a.field else None,
        ))
    return FormSubmissionResponse(
        id=sub.id,
        form_id=sub.form_id,
        contact_id=sub.contact_id,
        status=sub.status,
        workspace_id=sub.workspace_id,
        created_at=sub.created_at,
        answers=answers,
        contact_name=sub.contact.name if sub.contact else None,
        contact_email=sub.contact.email if sub.contact else None,
    )


# ── Authenticated CRUD (Owner / Staff) ──────────────────────────

@router.get("/", response_model=list[FormListResponse])
def list_forms(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all forms in the workspace."""
    forms = (
        db.query(Form)
        .filter(Form.workspace_id == current_user.workspace_id)
        .order_by(Form.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return forms


@router.get("/{form_id}", response_model=FormResponse)
def get_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single form with all fields."""
    from sqlalchemy.orm import joinedload
    form = db.query(Form).options(joinedload(Form.fields)).filter(
        Form.id == form_id,
        Form.workspace_id == current_user.workspace_id,
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.post("/", response_model=FormResponse, status_code=201, dependencies=[Depends(verify_csrf)])
def create_form(
    payload: FormCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new form with optional initial fields."""
    form = Form(
        title=payload.title,
        description=payload.description,
        purpose=payload.purpose,
        status=FormStatus.ACTIVE,
        workspace_id=current_user.workspace_id,
    )
    db.add(form)
    db.flush()  # get the id for slug generation

    form.public_slug = _generate_slug(payload.title, form.id)

    # Create fields if provided, otherwise default to Contact fields
    if payload.fields:
        for i, field_data in enumerate(payload.fields):
            field = FormField(
                form_id=form.id,
                label=field_data.label,
                field_type=field_data.field_type,
                required=field_data.required,
                field_order=field_data.field_order or i,
                options=field_data.options,
            )
            db.add(field)
    else:
        # Default fields: base 4 for all forms; for Booking Request add Date, Preferred Time, Schedule
        defaults = [
            FormField(form_id=form.id, label="Name", field_type=FieldType.TEXT, required=True, field_order=0),
            FormField(form_id=form.id, label="Gmail", field_type=FieldType.EMAIL, required=True, field_order=1),
            FormField(form_id=form.id, label="Number", field_type=FieldType.PHONE, required=True, field_order=2),
            FormField(form_id=form.id, label="Description", field_type=FieldType.TEXTAREA, required=False, field_order=3),
        ]
        if payload.purpose == FormPurpose.BOOKING:
            date_field = FormField(form_id=form.id, label="Date", field_type=FieldType.DATE, required=True, field_order=4)
            time_field = FormField(form_id=form.id, label="Preferred Time", field_type=FieldType.TEXT, required=False, field_order=5)
            
            defaults.extend([
                date_field,
                time_field,
                FormField(form_id=form.id, label="Schedule", field_type=FieldType.TEXT, required=False, field_order=6),
            ])
            
            db.add_all(defaults)
            db.flush() # Get IDs
            
            # Store metadata for reliable extraction
            form.meta = {
                "booking_date_field_id": date_field.id,
                "booking_time_field_id": time_field.id
            }
            db.add(form) # Mark form as modified
        else:
            db.add_all(defaults)
        
        logger.info(f"Created default fields for form {form.id} (booking={payload.purpose == FormPurpose.BOOKING})")

    db.commit()
    db.refresh(form)
    # Explicitly load fields to ensure they are returned
    form.fields = db.query(FormField).filter(FormField.form_id == form.id).order_by(FormField.field_order).all()
    return form


@router.put("/{form_id}", response_model=FormResponse, dependencies=[Depends(verify_csrf)])
def update_form(
    form_id: int,
    payload: FormUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a form's metadata (not fields)."""
    form = _get_form_or_404(db, form_id, current_user.workspace_id)
    update_data = payload.model_dump(exclude_unset=True)

    # Validate activation
    if update_data.get("status") == FormStatus.ACTIVE:
        # check if it has email or phone
        fields = db.query(FormField).filter(FormField.form_id == form_id).all()
        has_contact_field = any(f.field_type.value in ("email", "phone") for f in fields)
        if not has_contact_field:
            raise HTTPException(
                status_code=400,
                detail="Form must contain an 'email' or 'phone' field before activation."
            )

    for key, value in update_data.items():
        setattr(form, key, value)
    db.commit()
    db.refresh(form)
    return form


@router.delete("/{form_id}", status_code=204, dependencies=[Depends(verify_csrf)])
def delete_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a form and all its fields/submissions."""
    form = _get_form_or_404(db, form_id, current_user.workspace_id)
    db.delete(form)
    db.commit()


# ── Field Management ────────────────────────────────────────────

@router.post("/{form_id}/fields", response_model=FormFieldResponse, status_code=201, dependencies=[Depends(verify_csrf)])
def add_field(
    form_id: int,
    payload: FormFieldCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a field to a form."""
    form = _get_form_or_404(db, form_id, current_user.workspace_id)

    # Auto-set order if not provided
    if payload.field_order == 0:
        max_order = db.query(FormField).filter(FormField.form_id == form.id).count()
        payload.field_order = max_order

    field = FormField(
        form_id=form.id,
        label=payload.label,
        field_type=payload.field_type,
        required=payload.required,
        field_order=payload.field_order,
        options=payload.options,
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.put("/{form_id}/fields/{field_id}", response_model=FormFieldResponse, dependencies=[Depends(verify_csrf)])
def update_field(
    form_id: int,
    field_id: int,
    payload: FormFieldUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a field."""
    _get_form_or_404(db, form_id, current_user.workspace_id)
    field = db.query(FormField).filter(FormField.id == field_id, FormField.form_id == form_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)
    db.commit()
    db.refresh(field)
    return field


@router.delete("/{form_id}/fields/{field_id}", status_code=204, dependencies=[Depends(verify_csrf)])
def delete_field(
    form_id: int,
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a field from a form."""
    _get_form_or_404(db, form_id, current_user.workspace_id)
    field = db.query(FormField).filter(FormField.id == field_id, FormField.form_id == form_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(field)
    db.commit()


@router.put("/{form_id}/fields/reorder", response_model=list[FormFieldResponse], dependencies=[Depends(verify_csrf)])
def reorder_fields(
    form_id: int,
    field_ids: list[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reorder fields by providing the ordered list of field IDs."""
    _get_form_or_404(db, form_id, current_user.workspace_id)
    for i, fid in enumerate(field_ids):
        field = db.query(FormField).filter(FormField.id == fid, FormField.form_id == form_id).first()
        if field:
            field.field_order = i
    db.commit()
    fields = db.query(FormField).filter(FormField.form_id == form_id).order_by(FormField.field_order).all()
    return fields


# ── Form Submissions (authenticated view) ───────────────────────

@router.get("/{form_id}/submissions", response_model=list[FormSubmissionResponse])
def list_submissions(
    form_id: int,
    status_filter: SubmissionStatus = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List submissions for a form with optional status filter."""
    _get_form_or_404(db, form_id, current_user.workspace_id)

    query = db.query(FormSubmission).filter(
        FormSubmission.form_id == form_id,
        FormSubmission.workspace_id == current_user.workspace_id,
    )
    if status_filter:
        query = query.filter(FormSubmission.status == status_filter)

    subs = query.order_by(FormSubmission.created_at.desc()).offset(skip).limit(limit).all()
    return [_build_submission_response(s) for s in subs]


# ── Submission Approval / Rejection ─────────────────────────────

@router.post("/{form_id}/submissions/{sub_id}/approve", dependencies=[Depends(verify_csrf)])
def approve_submission(
    form_id: int,
    sub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve a submission → creates system message → dispatches form_approved."""
    form = _get_form_or_404(db, form_id, current_user.workspace_id)
    sub = db.query(FormSubmission).filter(
        FormSubmission.id == sub_id,
        FormSubmission.form_id == form_id,
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.status = SubmissionStatus.APPROVED
    db.commit()

    # Create approval message in conversation
    if sub.contact_id:
        conv = db.query(Conversation).filter(
            Conversation.contact_id == sub.contact_id,
            Conversation.workspace_id == current_user.workspace_id,
        ).first()
        if conv:
            msg = Message(
                content=f"Submission for \"{form.title}\" has been approved.",
                sender_type=SenderType.SYSTEM,
                message_type=MessageType.APPROVAL,
                conversation_id=conv.id,
                workspace_id=current_user.workspace_id,
                created_by=current_user.id,
            )
            db.add(msg)
            conv.last_message_at = datetime.now(timezone.utc)
            db.commit()

    # Dispatch event
    try:
        dispatch_event(
            workspace_id=current_user.workspace_id,
            event_type=AutomationEventType.FORM_APPROVED.value,
            reference_id=sub.id,
            db=db,
            payload={
                "contact_email": sub.contact.email if sub.contact else None,
                "contact_name": sub.contact.name if sub.contact else None,
                "form_title": form.title,
            },
        )
    except Exception as e:
        logger.error(f"Event dispatch failed: {e}")

    return {"status": "approved", "submission_id": sub.id}


@router.post("/{form_id}/submissions/{sub_id}/reject", dependencies=[Depends(verify_csrf)])
def reject_submission(
    form_id: int,
    sub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a submission."""
    _get_form_or_404(db, form_id, current_user.workspace_id)
    sub = db.query(FormSubmission).filter(
        FormSubmission.id == sub_id,
        FormSubmission.form_id == form_id,
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.status = SubmissionStatus.REJECTED
    db.commit()
    return {"status": "rejected", "submission_id": sub.id}


# ── Public Endpoints (no auth) ──────────────────────────────────

@router.get("/public/{slug}", response_model=PublicFormResponse)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    """Get a public form by slug for rendering (no auth)."""
    form = db.query(Form).filter(
        Form.public_slug == slug,
        Form.status == FormStatus.ACTIVE,
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or inactive")
    return form


@router.post("/public/{slug}/submit", status_code=201)
def submit_public_form(
    slug: str,
    payload: FormSubmissionCreate,
    db: Session = Depends(get_db),
):
    """
    Public form submission (Strict Flow).
    1. Validate form and required fields
    2. Extract identity (email/phone/name)
    3. Contact Resolution (find by email OR phone -> update or create)
    4. Conversation Resolution (find by workspace+contact -> create if missing)
    5. Create FormSubmission & Answers
    6. Create Inbox Message (System)
    7. Commit
    8. Dispatch Event
    """
    # ── 1. Validate Form ──
    form = db.query(Form).filter(
        Form.public_slug == slug,
        Form.status == FormStatus.ACTIVE,
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or inactive")

    workspace_id = form.workspace_id

    # Validate required fields
    form_fields = db.query(FormField).filter(FormField.form_id == form.id).all()
    field_map = {str(f.id): f for f in form_fields}
    
    # Check for missing required fields
    for field in form_fields:
        if field.required:
            val = payload.answers.get(str(field.id))
            if not val or not str(val).strip():
                raise HTTPException(status_code=400, detail=f"Field '{field.label}' is required")

    # ── 2. Extract Identity & Answers ──
    # Extract from explicit payload OR answers
    contact_name = payload.contact_name
    contact_email = payload.contact_email
    contact_phone = payload.contact_phone

    # If not provided explicitly, scrape from answers based on field type or label
    for field_id_str, value in payload.answers.items():
        field = field_map.get(field_id_str)
        if field and value:
            val_str = str(value).strip()
            if not val_str: continue

            if field.field_type == FieldType.EMAIL and not contact_email:
                contact_email = val_str
            elif field.field_type == FieldType.PHONE and not contact_phone:
                contact_phone = val_str
            elif field.label.lower() in ("name", "full name", "your name") and not contact_name:
                contact_name = val_str

    if not contact_email and not contact_phone:
        raise HTTPException(status_code=400, detail="Submission must include an email or phone number.")

    contact_name = contact_name or "Anonymous"

    # ── 3. Contact Resolution ──
    contact = None
    
    # Try find by email - If email is provided, it is the primary identity
    if contact_email:
        contact = db.query(Contact).filter(
            Contact.workspace_id == workspace_id,
            Contact.email == contact_email,
            Contact.is_deleted == False,
        ).first()
    # Try find by phone ONLY if no email was provided
    elif contact_phone:
        contact = db.query(Contact).filter(
            Contact.workspace_id == workspace_id,
            Contact.phone == contact_phone,
            Contact.is_deleted == False,
        ).first()

    if contact:
        # Update missing info
        if not contact.email and contact_email:
            contact.email = contact_email
        if not contact.phone and contact_phone:
            contact.phone = contact_phone
        if (not contact.name or contact.name == "New Contact") and contact_name != "Anonymous":
            contact.name = contact_name
    else:
        # Create new
        contact = Contact(
            name=contact_name,
            email=contact_email,
            phone=contact_phone,
            source=ContactSource.FORM,
            contact_type=ContactType.CUSTOMER,
            workspace_id=workspace_id,
        )
        db.add(contact)
        db.flush()

    # ── 4. Conversation Resolution ──
    conversation = db.query(Conversation).filter(
        Conversation.workspace_id == workspace_id,
        Conversation.contact_id == contact.id,
    ).first()

    if not conversation:
        conversation = Conversation(
            subject=f"Form: {form.title}",
            channel=ConversationChannel.FORM,
            contact_id=contact.id,
            workspace_id=workspace_id,
        )
        db.add(conversation)
        db.flush()

    # ── 5. Create Submission & Answers ──
    submission = FormSubmission(
        form_id=form.id,
        contact_id=contact.id,
        status=SubmissionStatus.PENDING,
        workspace_id=workspace_id,
    )
    db.add(submission)
    db.flush()

    for field_id_str, value in payload.answers.items():
        field = field_map.get(field_id_str)
        if field:
            answer = FormAnswer(
                submission_id=submission.id,
                field_id=field.id,
                value=str(value) if value is not None else None,
            )
            db.add(answer)

    # ── 6. Booking Logic (If applicable) ──
    booking = None
    if form.purpose == FormPurpose.BOOKING:
        from app.services.booking_service import BookingService
        try:
            booking = BookingService.create_from_submission(
                db=db,
                form=form,
                submission=submission,
                answers=payload.answers,
                contact=contact,
                conversation=conversation
            )
        except Exception as e:
            logger.error(f"Booking creation failed: {e}")

    # ── 7. Create Inbox Message (System) ──
    # Build metadata
    answer_summary = []
    for field_id_str, value in payload.answers.items():
        field = field_map.get(field_id_str)
        if field:
            answer_summary.append({
                "field_label": field.label,
                "field_type": field.field_type.value,
                "value": str(value) if value is not None else "",
            })

    msg_content = "New form submission received."
    if booking:
        msg_content = f"New booking request received for '{form.title}'."

    msg = Message(
        content=msg_content,
        sender_type=SenderType.SYSTEM,
        message_type=MessageType.FORM_SUBMISSION,
        metadata_={
            "form_id": form.id,
            "form_title": form.title,
            "submission_id": submission.id,
            "booking_id": booking.id if booking else None,
            "answers": answer_summary
        },
        conversation_id=conversation.id,
        workspace_id=workspace_id,
    )
    db.add(msg)
    
    # Update conversation timestamp
    conversation.last_message_at = datetime.now(timezone.utc)
    conversation.is_read = False

    # ── 8. Commit ──
    db.commit()

    # ── 9. Dispatch Event ──
    try:
        dispatch_event(
            workspace_id=workspace_id,
            event_type=AutomationEventType.FORM_SUBMITTED.value,
            reference_id=submission.id,
            db=db,
            payload={
                "contact_email": contact.email,
                "contact_name": contact.name,
                "form_title": form.title,
            },
        )
    except Exception as e:
        logger.error(f"Event dispatch failed: {e}")


    return {
        "success": True,
        "message": "Form submitted successfully",
        "submission_id": submission.id,
        "contact_id": contact.id
    }
