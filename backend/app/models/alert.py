"""
Alert model – system notifications with severity levels.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, Enum

from app.models.base import Base, TimestampMixin
from app.utils.enums import AlertSeverity


class Alert(TimestampMixin, Base):
    __tablename__ = "alerts"

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    severity = Column(Enum(AlertSeverity, name="alert_severity"), nullable=False, default=AlertSeverity.INFO)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
