"""
AutomationLog model — audit trail for event-driven automation.
Insert-only log table for traceability.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Index

from app.models.base import Base, TimestampMixin


class AutomationLog(TimestampMixin, Base):
    __tablename__ = "automation_logs"
    __table_args__ = (
        Index("ix_autolog_workspace_created", "workspace_id", "created_at"),
    )

    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    reference_id = Column(Integer, nullable=True)  # generic FK to the triggering entity
    status = Column(String(20), nullable=False, default="pending")

    def __repr__(self) -> str:
        return f"<AutomationLog id={self.id} event={self.event_type} status={self.status}>"
