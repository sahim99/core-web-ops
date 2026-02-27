"""
Inventory model – tracks items/materials with low-stock alerts.
"""

from sqlalchemy import Column, String, Integer, Float, ForeignKey, Boolean

from app.models.base import Base, TimestampMixin


class InventoryItem(TimestampMixin, Base):
    __tablename__ = "inventory_items"

    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True, index=True)
    quantity = Column(Float, nullable=False, default=0)
    unit = Column(String(50), nullable=True)
    low_stock_threshold = Column(Float, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
