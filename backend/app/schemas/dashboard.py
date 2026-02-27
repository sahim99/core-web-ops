"""
Dashboard schemas – stub for Phase 4.
"""

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_contacts: int = 0
    total_bookings: int = 0
    pending_bookings: int = 0
    total_forms: int = 0
    total_form_submissions: int = 0
    inventory_items: int = 0
    low_stock_alerts: int = 0
    unread_alerts: int = 0
