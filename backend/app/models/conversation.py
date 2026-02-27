"""
Conversation model – one conversation per contact per workspace.
All communication (manual, automated, form submissions, approvals) lives here.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Enum, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import ConversationChannel


class Conversation(TimestampMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("workspace_id", "contact_id", name="uq_workspace_contact"),
    )

    subject = Column(String(500), nullable=True)
    channel = Column(
        Enum(ConversationChannel, name="conversation_channel"),
        nullable=False,
        default=ConversationChannel.EMAIL,
    )
    is_read = Column(Boolean, default=False, nullable=False)
    last_message_at = Column(DateTime(timezone=True), nullable=True, index=True)
    manual_override = Column(Boolean, default=False, nullable=False)

    # Foreign keys
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at.asc()")
    contact = relationship("Contact", lazy="joined")

    def __repr__(self) -> str:
        return f"<Conversation id={self.id} contact_id={self.contact_id}>"
