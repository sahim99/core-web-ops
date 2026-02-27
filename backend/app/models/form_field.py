"""
FormField model — individual fields within a dynamic form.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import FieldType


class FormField(TimestampMixin, Base):
    __tablename__ = "form_fields"

    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    field_type = Column(
        Enum(FieldType, name="field_type"),
        nullable=False,
        default=FieldType.TEXT,
    )
    required = Column(Boolean, default=False, nullable=False)
    field_order = Column(Integer, nullable=False, default=0)
    options = Column(JSON, nullable=True)  # for select fields: ["Option A", "Option B"]

    # Relationships
    form = relationship("Form", back_populates="fields")

    def __repr__(self) -> str:
        return f"<FormField id={self.id} label={self.label} type={self.field_type}>"
