from sqlalchemy import Column, Integer, Boolean, ForeignKey
from app.models.base import Base

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    email_alerts = Column(Boolean, default=True, nullable=False)
    in_app_notifications = Column(Boolean, default=True, nullable=False)
    marketing_emails = Column(Boolean, default=False, nullable=False)
