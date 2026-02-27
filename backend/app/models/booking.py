"""
Booking model – service bookings linked to contacts and form submissions.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum, Text, Index
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import BookingStatus

class Booking(TimestampMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_workspace_booking_start", "workspace_id", "start_time"),
    )

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    
    status = Column(Enum(BookingStatus, name="booking_status"), nullable=False, default=BookingStatus.PENDING, index=True)
    
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    form_submission_id = Column(Integer, ForeignKey("form_submissions.id", ondelete="SET NULL"), nullable=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    contact = relationship("Contact", backref="bookings")
    submission = relationship("FormSubmission", backref="booking")
    workspace = relationship("Workspace", backref="bookings")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self) -> str:
        return f"<Booking id={self.id} title={self.title} status={self.status} start={self.start_time}>"
