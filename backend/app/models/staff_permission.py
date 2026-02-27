"""
StaffPermission model – module-level permissions for staff users.
Owner always has full access. Staff permissions are checked per-module.
"""

from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class StaffPermission(TimestampMixin, Base):
    __tablename__ = "staff_permissions"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    can_manage_inbox = Column(Boolean, default=False, nullable=False)
    can_manage_bookings = Column(Boolean, default=False, nullable=False)
    can_manage_forms = Column(Boolean, default=False, nullable=False)
    can_view_inventory = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="permissions")

    @property
    def inbox(self):
        return self.can_manage_inbox

    @property
    def bookings(self):
        return self.can_manage_bookings

    @property
    def forms(self):
        return self.can_manage_forms

    @property
    def inventory(self):
        return self.can_view_inventory

    def __repr__(self) -> str:
        return f"<StaffPermission user_id={self.user_id}>"
