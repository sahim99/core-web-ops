"""
Inventory schemas – Phase 2.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryItemCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    quantity: float = 0
    unit: Optional[str] = None
    low_stock_threshold: Optional[float] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    low_stock_threshold: Optional[float] = None


class InventoryItemResponse(BaseModel):
    id: int
    name: str
    sku: Optional[str]
    quantity: float
    unit: Optional[str]
    low_stock_threshold: Optional[float]
    is_low_stock: bool = False
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True
