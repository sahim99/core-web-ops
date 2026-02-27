"""
WebSocket Connection Manager for Internal Messaging.

Tracks active WebSocket connections per workspace.
Handles connect, disconnect, and broadcast with fault tolerance.
"""

import logging
import asyncio
import time
from typing import Dict, Set
from collections import defaultdict
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

MAX_CONNECTIONS_PER_WORKSPACE = 50
RATE_LIMIT_MESSAGES_PER_SEC = 5


class ConnectionEntry:
    """Represents a single WebSocket connection."""
    __slots__ = ("websocket", "user_id", "user_name", "connected_at")

    def __init__(self, websocket: WebSocket, user_id: int, user_name: str):
        self.websocket = websocket
        self.user_id = user_id
        self.user_name = user_name
        self.connected_at = time.time()


class RateLimiter:
    """Simple per-user token bucket rate limiter."""

    def __init__(self, max_per_sec: int = RATE_LIMIT_MESSAGES_PER_SEC):
        self._max = max_per_sec
        self._buckets: Dict[int, list] = defaultdict(list)

    def allow(self, user_id: int) -> bool:
        now = time.time()
        # Prune old timestamps
        self._buckets[user_id] = [
            t for t in self._buckets[user_id] if now - t < 1.0
        ]
        if len(self._buckets[user_id]) >= self._max:
            return False
        self._buckets[user_id].append(now)
        return True

    def cleanup_user(self, user_id: int):
        self._buckets.pop(user_id, None)


class WebSocketManager:
    """
    Manages WebSocket connections grouped by workspace_id.

    Structure:
        { workspace_id: { connection_id: ConnectionEntry } }

    Each tab gets its own connection_id (user_id:timestamp).
    Multiple tabs from the same user are supported.
    """

    def __init__(self):
        # workspace_id → { conn_id: ConnectionEntry }
        self._connections: Dict[int, Dict[str, ConnectionEntry]] = defaultdict(dict)
        self._rate_limiter = RateLimiter()

    def _conn_id(self, user_id: int, websocket: WebSocket) -> str:
        """Generate a unique connection ID per tab."""
        return f"{user_id}:{id(websocket)}"

    async def connect(
        self, workspace_id: int, user_id: int, user_name: str, websocket: WebSocket
    ) -> bool:
        """
        Register a new WebSocket connection.
        Returns False if workspace is full.
        """
        pool = self._connections[workspace_id]
        if len(pool) >= MAX_CONNECTIONS_PER_WORKSPACE:
            logger.warning(
                f"WS: workspace {workspace_id} full ({len(pool)} connections). Rejecting user {user_id}."
            )
            return False

        conn_id = self._conn_id(user_id, websocket)
        pool[conn_id] = ConnectionEntry(websocket, user_id, user_name)
        logger.info(
            f"WS: user {user_id} ({user_name}) connected to workspace {workspace_id}. "
            f"Active: {len(pool)}"
        )
        return True

    def disconnect(self, workspace_id: int, user_id: int, websocket: WebSocket):
        """Remove a connection from the registry."""
        pool = self._connections.get(workspace_id)
        if not pool:
            return
        conn_id = self._conn_id(user_id, websocket)
        entry = pool.pop(conn_id, None)
        if entry:
            logger.info(
                f"WS: user {user_id} disconnected from workspace {workspace_id}. "
                f"Active: {len(pool)}"
            )
        # Clean up empty workspace slot
        if not pool:
            self._connections.pop(workspace_id, None)

    async def broadcast(
        self,
        workspace_id: int,
        event_type: str,
        payload: dict,
        exclude_user_id: int | None = None,
    ):
        """
        Send an event to all connections in a workspace.
        Broken sockets are automatically removed.
        """
        pool = self._connections.get(workspace_id)
        if not pool:
            return

        message = {"type": event_type, "payload": payload}
        dead: list[str] = []

        for conn_id, entry in pool.items():
            if exclude_user_id is not None and entry.user_id == exclude_user_id:
                continue
            try:
                await entry.websocket.send_json(message)
            except Exception:
                dead.append(conn_id)
                logger.debug(f"WS: dead socket {conn_id} in workspace {workspace_id}")

        # Clean up broken sockets
        for conn_id in dead:
            pool.pop(conn_id, None)
        if not pool:
            self._connections.pop(workspace_id, None)

    async def send_to_user(
        self, workspace_id: int, user_id: int, event_type: str, payload: dict
    ):
        """Send an event to all connections of a specific user."""
        pool = self._connections.get(workspace_id)
        if not pool:
            return

        message = {"type": event_type, "payload": payload}
        dead: list[str] = []

        for conn_id, entry in pool.items():
            if entry.user_id != user_id:
                continue
            try:
                await entry.websocket.send_json(message)
            except Exception:
                dead.append(conn_id)

        for conn_id in dead:
            pool.pop(conn_id, None)

    def check_rate_limit(self, user_id: int) -> bool:
        """Returns True if the user is within rate limits."""
        return self._rate_limiter.allow(user_id)

    def get_online_users(self, workspace_id: int) -> list[dict]:
        """Return list of unique online users in a workspace."""
        pool = self._connections.get(workspace_id, {})
        seen: Dict[int, str] = {}
        for entry in pool.values():
            if entry.user_id not in seen:
                seen[entry.user_id] = entry.user_name
        return [{"id": uid, "name": name} for uid, name in seen.items()]

    def get_stats(self) -> dict:
        """Debug stats."""
        return {
            ws_id: len(pool)
            for ws_id, pool in self._connections.items()
        }


# ── Singleton instance ────────────────────────────────────────────
ws_manager = WebSocketManager()
