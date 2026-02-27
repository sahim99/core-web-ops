"""
Message model – child of Conversation.
Each message has a sender_type, message_type, and optional structured metadata.
Old 'direction' and 'body' columns kept temporarily for migration safety.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base, TimestampMixin
from app.utils.enums import SenderType, MessageType


# Keep old enum for migration compatibility (do not use in new code)
class MessageDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    SYSTEM = "system"


class Message(TimestampMixin, Base):
    __tablename__ = "messages"

    # ── New columns (Phase 1) ────────────────────────────────
    content = Column(Text, nullable=True)  # nullable during migration, then enforced
    sender_type = Column(
        SAEnum(SenderType, name="sender_type"),
        nullable=True,  # nullable during migration
    )
    message_type = Column(
        SAEnum(MessageType, name="message_type"),
        nullable=True,  # nullable during migration
        default=MessageType.MANUAL,
    )
    metadata_ = Column("metadata", JSON, nullable=True)  # structured data (form answers, etc.)

    # ── Old columns (kept for migration, will be dropped after backfill) ──
    body = Column(Text, nullable=True)
    direction = Column(
        SAEnum(MessageDirection, name="message_direction"),
        nullable=True,
    )

    # Foreign keys
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
