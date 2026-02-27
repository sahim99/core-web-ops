"""
Inbox schemas – Threaded Conversations with typed Messages.
"""

from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

from app.utils.enums import ConversationChannel, SenderType, MessageType


# ── Message schemas ─────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str
    sender_type: SenderType = SenderType.BUSINESS
    message_type: MessageType = MessageType.MANUAL
    metadata_: Optional[dict[str, Any]] = None

    class Config:
        # Allow metadata_ to map from JSON field "metadata"
        populate_by_name = True


class MessageUpdate(BaseModel):
    content: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    content: Optional[str]
    sender_type: Optional[SenderType]
    message_type: Optional[MessageType]
    metadata_: Optional[dict[str, Any]] = None
    conversation_id: int
    workspace_id: int
    created_by: Optional[int]
    created_at: datetime

    # Backward compat: also expose old fields
    body: Optional[str] = None
    direction: Optional[str] = None

    class Config:
        from_attributes = True


# ── Conversation schemas ────────────────────────────────────────

class ConversationCreate(BaseModel):
    subject: Optional[str] = None
    channel: ConversationChannel = ConversationChannel.EMAIL
    contact_id: int
    initial_message: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    subject: Optional[str]
    channel: ConversationChannel
    is_read: bool
    last_message_at: Optional[datetime]
    contact_id: int
    workspace_id: int
    created_at: datetime
    contact_name: Optional[str] = None
    last_message_preview: Optional[str] = None
    message_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    """Full conversation with all messages."""
    messages: list[MessageResponse] = []


class UnreadCountResponse(BaseModel):
    count: int
