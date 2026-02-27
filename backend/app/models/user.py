"""
User model – internal users (Owner, Staff). Customers do NOT log in.
"""

from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import UserRole


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("workspace_id", "email", name="uq_workspace_email"),
    )

    email = Column(String(320), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.STAFF)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)

    # ── Staff Identity Fields ──────────────────────────────────
    # Only populated for role="staff". Owners keep these NULL.
    staff_id = Column(String(20), unique=True, nullable=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="users")
    permissions = relationship("StaffPermission", back_populates="user", uselist=False, cascade="all, delete-orphan")
    owner = relationship("User", remote_side="User.id", foreign_keys=[owner_id])

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"

    @property
    def workspace_status(self):
        return self.workspace.status if self.workspace else None
