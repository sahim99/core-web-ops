"""
Contact model – external customers/leads/providers/vendors. Contacts do NOT authenticate.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Boolean, Index
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import ContactSource, ContactType


class Contact(TimestampMixin, Base):
    __tablename__ = "contacts"
    __table_args__ = (
        Index("ix_workspace_contact_created", "workspace_id", "created_at"),
        Index("ix_workspace_email", "workspace_id", "email"),
    )

    name = Column(String(255), nullable=False)
    email = Column(String(320), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    notes = Column(String(1000), nullable=True)
    source = Column(Enum(ContactSource, name="contact_source"), nullable=False, default=ContactSource.MANUAL)
    contact_type = Column(
        Enum(ContactType, name="contact_type"),
        nullable=False,
        default=ContactType.CUSTOMER,
    )
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="contacts")

    def __repr__(self) -> str:
        return f"<Contact id={self.id} name={self.name} type={self.contact_type}>"
