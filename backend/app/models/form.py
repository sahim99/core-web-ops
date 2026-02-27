"""
Form, FormSubmission models — dynamic forms with purpose, status, and public slug.
Old fields_schema kept temporarily for migration safety.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Boolean, Enum, Index
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import FormPurpose, FormStatus, SubmissionStatus


class Form(TimestampMixin, Base):
    __tablename__ = "forms"
    __table_args__ = (
        Index("ix_form_public_slug", "public_slug", unique=True),
    )

    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    purpose = Column(
        Enum(FormPurpose, name="form_purpose"),
        nullable=True,  # nullable during migration
        default=FormPurpose.CUSTOM,
    )
    status = Column(
        Enum(FormStatus, name="form_status"),
        nullable=True,  # nullable during migration
        default=FormStatus.ACTIVE,
    )
    public_slug = Column(String(255), nullable=True, unique=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Configuration metadata (e.g., { "booking_date_field_id": 12, "booking_time_field_id": 13 })
    meta = Column(JSON, nullable=True, default={})

    # Old columns (kept for migration, will be dropped after backfill)
    fields_schema = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=True)

    # Relationships
    fields = relationship("FormField", back_populates="form", cascade="all, delete-orphan", order_by="FormField.field_order")
    submissions = relationship("FormSubmission", back_populates="form", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Form id={self.id} title={self.title} status={self.status}>"


class FormSubmission(TimestampMixin, Base):
    __tablename__ = "form_submissions"

    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(
        Enum(SubmissionStatus, name="submission_status"),
        nullable=True,  # nullable during migration
        default=SubmissionStatus.PENDING,
    )
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Old column (kept for migration)
    data = Column(JSON, nullable=True)

    # Relationships
    form = relationship("Form", back_populates="submissions")
    answers = relationship("FormAnswer", back_populates="submission", cascade="all, delete-orphan")
    contact = relationship("Contact", lazy="joined")

    def __repr__(self) -> str:
        return f"<FormSubmission id={self.id} form_id={self.form_id} status={self.status}>"
