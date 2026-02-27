"""
Inventory API – Full CRUD with low-stock detection, workspace-scoped.
Accessible by Owner and Staff.
Negative stock is rejected unless explicitly designed.
"""

import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.dependencies import require_permission
from app.models.user import User
from app.models.inventory import InventoryItem
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from app.core.csrf import verify_csrf

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    dependencies=[Depends(require_permission("inventory"))],
)


def _to_response(item: InventoryItem) -> dict:
    """Convert an InventoryItem to a response dict with is_low_stock computed."""
    return {
        "id": item.id,
        "name": item.name,
        "sku": item.sku,
        "quantity": item.quantity,
        "unit": item.unit,
        "low_stock_threshold": item.low_stock_threshold,
        "workspace_id": item.workspace_id,
        "created_at": item.created_at,
        "is_low_stock": (
            item.low_stock_threshold is not None
            and item.quantity <= item.low_stock_threshold
        ),
    }


def _validate_quantity(quantity: float | None) -> None:
    """Reject negative stock values."""
    if quantity is not None and quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Quantity cannot be negative",
        )


@router.get("/", response_model=list[InventoryItemResponse])
def list_items(
    low_stock_only: bool = Query(False, description="Filter to low-stock items only"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List inventory items – supports search and low-stock filter."""
    query = db.query(InventoryItem).filter(
        InventoryItem.workspace_id == current_user.workspace_id,
        InventoryItem.is_deleted == False,
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (InventoryItem.name.ilike(search_term))
            | (InventoryItem.sku.ilike(search_term))
        )

    items = query.order_by(InventoryItem.name).offset(skip).limit(limit).all()

    results = [_to_response(item) for item in items]

    if low_stock_only:
        results = [r for r in results if r["is_low_stock"]]

    return results


@router.get("/{item_id}", response_model=InventoryItemResponse)
def get_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single inventory item – workspace scoped."""
    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id, InventoryItem.workspace_id == current_user.workspace_id, InventoryItem.is_deleted == False)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return _to_response(item)


@router.post("/", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_csrf)])
def create_item(
    payload: InventoryItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new inventory item."""
    _validate_quantity(payload.quantity)

    item = InventoryItem(
        **payload.model_dump(),
        workspace_id=current_user.workspace_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_response(item)


@router.put("/{item_id}", response_model=InventoryItemResponse, dependencies=[Depends(verify_csrf)])
def update_item(
    item_id: int,
    payload: InventoryItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an inventory item – workspace scoped. Rejects negative stock."""
    _validate_quantity(payload.quantity)

    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id, InventoryItem.workspace_id == current_user.workspace_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    update_data = payload.model_dump(exclude_unset=True)

    # ── Capture pre-update low-stock state for transition detection ──
    was_low_stock = (
        item.quantity <= item.low_stock_threshold
        if item.low_stock_threshold is not None
        else False
    )

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    result = _to_response(item)

    # ── Fire automation ONLY on transition: was NOT low → now IS low ──
    is_now_low = result["is_low_stock"]
    if is_now_low and not was_low_stock:
        # Create persistent system alert reliably
        from app.services.alert_service import create_alert
        from app.utils.enums import AlertSeverity
        create_alert(
            title=f"Low Stock: {item.name}",
            message=f"{item.name} is down to {item.quantity} {item.unit or 'units'} (threshold: {item.low_stock_threshold}).",
            severity=AlertSeverity.WARNING,
            workspace_id=current_user.workspace_id,
            db=db,
        )
        db.commit()

        # Fire external automation (emails, sms, webhooks)
        try:
            from app.services.automation_engine import fire_event
            asyncio.get_event_loop().run_until_complete(
                fire_event(
                    event_type="inventory.low_stock",
                    workspace_id=current_user.workspace_id,
                    payload={
                        "item_id": item.id,
                        "item_name": item.name,
                        "quantity": item.quantity,
                        "threshold": item.low_stock_threshold,
                        "title": f"Low Stock: {item.name}",
                        "message": f"{item.name} is down to {item.quantity} {item.unit or 'units'} (threshold: {item.low_stock_threshold}).",
                    },
                    db=db,
                )
            )
        except Exception:
            pass  # automation must never block the request

    return result


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an inventory item – workspace scoped."""
    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id, InventoryItem.workspace_id == current_user.workspace_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    item.is_deleted = True
    db.commit()
