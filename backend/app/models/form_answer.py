"""
FormAnswer model — individual field answers within a form submission.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class FormAnswer(TimestampMixin, Base):
    __tablename__ = "form_answers"

    submission_id = Column(Integer, ForeignKey("form_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(Integer, ForeignKey("form_fields.id", ondelete="CASCADE"), nullable=False, index=True)
    value = Column(Text, nullable=True)

    # Relationships
    submission = relationship("FormSubmission", back_populates="answers")
    field = relationship("FormField", lazy="joined")

    def __repr__(self) -> str:
        return f"<FormAnswer id={self.id} field_id={self.field_id}>"
