"""
EventLog model – automation engine audit trail.
Records every automation event for traceability.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Text, Index

from app.models.base import Base, TimestampMixin


class EventLog(TimestampMixin, Base):
    __tablename__ = "event_logs"
    __table_args__ = (
        Index("ix_eventlog_workspace_created", "workspace_id", "created_at"),
    )

    event_type = Column(String(100), nullable=False, index=True)
    source = Column(String(100), nullable=True)
    triggered_by = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="success")
    payload = Column(JSON, nullable=True)
    result = Column(Text, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    execution_ms = Column(Integer, nullable=True)
    action_count = Column(Integer, nullable=True, default=0)
    failed_action_count = Column(Integer, nullable=True, default=0)
