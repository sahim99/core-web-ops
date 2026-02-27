"""
Workspace model – every record in the system belongs to a workspace.
"""

from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import WorkspaceStatus


class Workspace(TimestampMixin, Base):
    __tablename__ = "workspaces"

    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(
        Enum(WorkspaceStatus, name="workspace_status"),
        default=WorkspaceStatus.SETUP,
        nullable=False,
    )

    # Relationships — cascade delete all children
    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan", lazy="dynamic")
    contacts = relationship("Contact", back_populates="workspace", cascade="all, delete-orphan", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Workspace id={self.id} slug={self.slug} status={self.status}>"
