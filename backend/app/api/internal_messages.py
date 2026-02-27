"""
Internal Messages API — Real-time team chat via WebSocket.

Endpoints:
  GET   /internal/messages             — List messages (latest 50)
  POST  /internal/messages             — Send message + broadcast via WS
  WS    /ws/internal-messages          — WebSocket for real-time events

WS Event Types (server → client):
  new_message, typing_start, typing_stop, connected

WS Event Types (client → server):
  typing_start, typing_stop
"""

import logging
import json
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc
from pydantic import BaseModel

from ..core.database import get_db, SessionLocal
from ..core.security import get_current_user, decode_access_token
from ..core.websocket_manager import ws_manager
from ..models.internal_message import InternalMessage
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["internal-messages"])


# ── Schemas ───────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    sender_id: int
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


class CreateMessagePayload(BaseModel):
    content: str


# ── Helpers ───────────────────────────────────────────────────────

def _ws_authenticate(websocket: WebSocket, db: Session) -> Optional[User]:
    """Extract and validate JWT from the WebSocket cookie."""
    token = websocket.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(
            User.id == int(user_id), User.is_active == True
        ).first()
        return user
    except Exception:
        return None


def _serialize_message(msg: InternalMessage, sender_name: str = "Unknown") -> dict:
    """Convert a message ORM object to a JSON-safe dict."""
    return {
        "id": msg.id,
        "content": msg.content,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
        "sender_id": msg.sender_id,
        "sender_name": sender_name,
    }


# ── REST: List Messages ──────────────────────────────────────────

@router.get("/internal/messages", response_model=List[MessageResponse])
def list_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List latest 50 messages in the workspace (chronological order)."""
    msgs = (
        db.query(InternalMessage)
        .options(selectinload(InternalMessage.sender))
        .filter(InternalMessage.workspace_id == current_user.workspace_id)
        .order_by(desc(InternalMessage.created_at))
        .limit(50)
        .all()
    )
    return [
        MessageResponse(
            id=m.id,
            content=m.content,
            created_at=m.created_at,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name if m.sender else "Unknown",
        )
        for m in reversed(msgs)
    ]


# ── REST: Send Message ───────────────────────────────────────────

@router.post("/internal/messages", response_model=MessageResponse)
async def send_message(
    payload: CreateMessagePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a message, save to DB, broadcast to workspace via WebSocket."""
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(content) > 5000:
        raise HTTPException(status_code=400, detail="Message too long (max 5000 chars)")

    # Rate limit
    if not ws_manager.check_rate_limit(current_user.id):
        raise HTTPException(status_code=429, detail="Too many messages. Slow down.")

    # Save to DB
    msg = InternalMessage(
        workspace_id=current_user.workspace_id,
        sender_id=current_user.id,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    serialized = _serialize_message(msg, current_user.full_name)

    # Broadcast to other connected clients in workspace (sender already has it from POST response)
    await ws_manager.broadcast(
        workspace_id=current_user.workspace_id,
        event_type="new_message",
        payload=serialized,
        exclude_user_id=current_user.id,
    )

    return MessageResponse(**serialized)


# ── WebSocket: Real-Time Chat ────────────────────────────────────

@router.websocket("/ws/internal-messages")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for real-time internal messaging.

    Auth: Reads JWT from httpOnly cookie (sent automatically by browser).
    Protocol:
      Server → Client: { type: "new_message"|"typing_start"|"typing_stop"|"connected", payload: {...} }
      Client → Server: { type: "typing_start"|"typing_stop" }
    """
    # 1. Accept connection (required to read cookies)
    await websocket.accept()

    # 2. Authenticate via cookie
    db = SessionLocal()
    try:
        user = _ws_authenticate(websocket, db)
        if not user:
            await websocket.send_json({
                "type": "error",
                "payload": {"message": "Authentication failed"},
            })
            await websocket.close(code=4001, reason="Unauthorized")
            return
        workspace_id = user.workspace_id
        user_id = user.id
        user_name = user.full_name
    finally:
        db.close()

    # 3. Register connection
    accepted = await ws_manager.connect(workspace_id, user_id, user_name, websocket)
    if not accepted:
        await websocket.send_json({
            "type": "error",
            "payload": {"message": "Workspace connection limit reached"},
        })
        await websocket.close(code=4002, reason="Connection limit")
        return

    # 4. Send confirmation + online users
    await websocket.send_json({
        "type": "connected",
        "payload": {
            "user_id": user_id,
            "workspace_id": workspace_id,
            "online_users": ws_manager.get_online_users(workspace_id),
        },
    })

    logger.info(f"WS: Chat connected — user={user_id}, workspace={workspace_id}")

    # 5. Listen loop
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = data.get("type")
            if not event_type:
                continue

            # Relay typing events to other users
            if event_type in ("typing_start", "typing_stop"):
                await ws_manager.broadcast(
                    workspace_id,
                    event_type,
                    {"user_id": user_id, "user_name": user_name},
                    exclude_user_id=user_id,
                )

    except WebSocketDisconnect:
        logger.info(f"WS: user {user_id} disconnected (clean)")
    except Exception as e:
        logger.warning(f"WS: user {user_id} error: {e}")
    finally:
        ws_manager.disconnect(workspace_id, user_id, websocket)
