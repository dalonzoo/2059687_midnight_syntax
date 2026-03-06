"""
websocket_manager.py — WebSocket connection manager for the Dashboard Service.

Manages all active WebSocket connections from frontend clients and
broadcasts real-time events (sensor updates, actuator changes) to them.
"""

import logging
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("dashboard-service.ws")


class WebSocketManager:
    """
    Manages active WebSocket connections and broadcasts messages.

    Handles connection lifecycle (connect/disconnect) and provides
    a broadcast method to push JSON messages to all connected clients.
    """

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            "WebSocket client connected. Total connections: %d",
            len(self.active_connections),
        )

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection from the active list."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(
            "WebSocket client disconnected. Total connections: %d",
            len(self.active_connections),
        )

    async def broadcast(self, message: dict[str, Any]):
        """
        Send a JSON message to all connected WebSocket clients.
        Automatically removes dead connections.
        """
        dead_connections = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except (WebSocketDisconnect, RuntimeError):
                dead_connections.append(ws)
            except Exception as e:
                logger.warning("Error broadcasting to client: %s", e)
                dead_connections.append(ws)

        # Clean up dead connections
        for ws in dead_connections:
            self.disconnect(ws)
