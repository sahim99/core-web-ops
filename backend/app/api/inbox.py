"""
Inbox API – Threaded Conversations with Messages.
Workspace-scoped, Owner/Staff access.
Uses new message model: content, sender_type, message_type, metadata.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.dependencies import require_permission
from app.models.user import User
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.utils.enums import ConversationChannel, SenderType, MessageType, AutomationEventType
from app.schemas.inbox import (
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    UnreadCountResponse,
)
from app.services.event_dispatcher import dispatch_event

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/inbox",
    tags=["Inbox"],
    dependencies=[Depends(require_permission("inbox"))],
)


# ── Helpers ──────────────────────────────────────────────────────

def _conversation_to_response(conv: Conversation, db: Session) -> dict:
    """Build a ConversationResponse dict with preview and counts."""
    msg_count = db.query(func.count(Message.id)).filter(Message.conversation_id == conv.id).scalar() or 0
    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .first()
    )

    # Use content first, fall back to body for backcompat
    preview = None
    if last_msg:
        text = last_msg.content or last_msg.body or ""
        preview = (text[:120] + "…") if len(text) > 120 else text

    return {
        "id": conv.id,
        "subject": conv.subject,
        "channel": conv.channel,
        "is_read": conv.is_read,
        "last_message_at": conv.last_message_at,
        "contact_id": conv.contact_id,
        "workspace_id": conv.workspace_id,
        "created_at": conv.created_at,
        "contact_name": conv.contact.name if conv.contact else None,
        "last_message_preview": preview,
        "message_count": msg_count,
    }


def _message_to_response(msg: Message) -> dict:
    """Build MessageResponse dict, bridging old and new fields."""
    return {
        "id": msg.id,
        "content": msg.content or msg.body,
        "sender_type": msg.sender_type,
        "message_type": msg.message_type,
        "metadata_": msg.metadata_,
        "conversation_id": msg.conversation_id,
        "workspace_id": msg.workspace_id,
        "created_by": msg.created_by,
        "created_at": msg.created_at,
        # Backward compat
        "body": msg.body,
        "direction": msg.direction.value if msg.direction else None,
    }


# ── Conversations CRUD ───────────────────────────────────────────

@router.get("/", response_model=list[ConversationResponse])
def list_conversations(
    channel: Optional[ConversationChannel] = Query(None),
    is_read: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List conversations – sorted by last_message_at desc (newest first)."""
    query = db.query(Conversation).filter(
        Conversation.workspace_id == current_user.workspace_id
    )

    if channel:
        query = query.filter(Conversation.channel == channel)
    if is_read is not None:
        query = query.filter(Conversation.is_read == is_read)

    convs = (
        query.order_by(Conversation.last_message_at.desc().nullslast())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_conversation_to_response(c, db) for c in convs]


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get unread conversation count."""
    count = (
        db.query(func.count(Conversation.id))
        .filter(
            Conversation.workspace_id == current_user.workspace_id,
            Conversation.is_read == False,
        )
        .scalar()
    )
    return {"count": count or 0}


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full conversation with all messages."""
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    response = _conversation_to_response(conv, db)
    response["messages"] = [_message_to_response(m) for m in conv.messages]
    return response


@router.post("/", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new conversation – validates contact in workspace (403 on mismatch)."""
    contact = (
        db.query(Contact)
        .filter(
            Contact.id == payload.contact_id,
            Contact.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contact does not belong to this workspace",
        )

    # Check if conversation already exists (unique constraint)
    existing = db.query(Conversation).filter(
        Conversation.workspace_id == current_user.workspace_id,
        Conversation.contact_id == payload.contact_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conversation already exists for this contact",
        )

    now = datetime.now(timezone.utc)
    conv = Conversation(
        subject=payload.subject,
        channel=payload.channel,
        contact_id=payload.contact_id,
        workspace_id=current_user.workspace_id,
        last_message_at=now if payload.initial_message else None,
    )
    db.add(conv)
    db.flush()

    # Create initial message if provided
    if payload.initial_message:
        msg = Message(
            content=payload.initial_message,
            body=payload.initial_message,  # backcompat
            sender_type=SenderType.BUSINESS,
            message_type=MessageType.MANUAL,
            conversation_id=conv.id,
            workspace_id=current_user.workspace_id,
            created_by=current_user.id,
        )
        db.add(msg)

    db.commit()
    db.refresh(conv)

    response = _conversation_to_response(conv, db)
    response["messages"] = [_message_to_response(m) for m in conv.messages]
    return response


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation and all its messages – workspace scoped."""
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    db.delete(conv)  # cascade deletes messages
    db.commit()


# ── Messages (nested under conversation) ────────────────────────

@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def add_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a message to a conversation → dispatches staff_replied event."""
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    now = datetime.now(timezone.utc)
    msg = Message(
        content=payload.content,
        body=payload.content,  # backcompat
        sender_type=payload.sender_type,
        message_type=payload.message_type,
        metadata_=payload.metadata_,
        conversation_id=conversation_id,
        workspace_id=current_user.workspace_id,
        created_by=current_user.id,
    )
    db.add(msg)

    # Update conversation timestamp
    conv.last_message_at = now
    conv.is_read = True  # user is replying, so it's read

    db.commit()
    db.refresh(msg)

    # Dispatch staff_replied event (non-blocking)
    if payload.sender_type == SenderType.BUSINESS:
        try:
            dispatch_event(
                workspace_id=current_user.workspace_id,
                event_type=AutomationEventType.STAFF_REPLIED.value,
                reference_id=msg.id,
                db=db,
                payload={
                    "contact_email": conv.contact.email if conv.contact else None,
                    "contact_name": conv.contact.name if conv.contact else None,
                    "message_content": payload.content,
                },
            )
        except Exception as e:
            logger.error(f"Event dispatch failed: {e}")

    return _message_to_response(msg)


@router.put("/{conversation_id}/messages/{message_id}", response_model=MessageResponse)
def edit_message(
    conversation_id: int,
    message_id: int,
    payload: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edit a message – only allowed if created by current user."""
    msg = (
        db.query(Message)
        .filter(
            Message.id == message_id,
            Message.conversation_id == conversation_id,
            Message.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if msg.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own messages",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(msg, key, value)
        # Also update body for backcompat
        if key == "content":
            msg.body = value

    db.commit()
    db.refresh(msg)
    return _message_to_response(msg)


# ── Mark read ────────────────────────────────────────────────────

@router.post("/{conversation_id}/mark-read", status_code=status.HTTP_200_OK)
def mark_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a conversation as read."""
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    conv.is_read = True
    db.commit()
    return {"detail": "Marked as read"}


@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all conversations as read."""
    db.query(Conversation).filter(
        Conversation.workspace_id == current_user.workspace_id,
        Conversation.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"detail": "All conversations marked as read"}
