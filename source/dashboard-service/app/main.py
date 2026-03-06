"""
main.py — FastAPI entry point for the Dashboard Service.

On startup:
  - Launches a Kafka consumer that reads sensor.events and actuator.events.
  - Broadcasts events to all connected frontend WebSocket clients.
  - Proxies REST API calls to the Processing Service.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.kafka_consumer import run_kafka_consumer
from app.websocket_manager import WebSocketManager
from app.routes import proxy

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("dashboard-service")

# Global WebSocket manager (shared between Kafka consumer and WS endpoint)
ws_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown:
    - Starts the Kafka consumer background task.
    """
    logger.info("Starting Dashboard Service...")

    # Launch Kafka consumer as background task
    consumer_task = asyncio.create_task(run_kafka_consumer(ws_manager))
    logger.info("Kafka consumer task launched.")

    yield  # Application is running

    # Shutdown
    logger.info("Shutting down Dashboard Service...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    logger.info("Dashboard Service stopped.")


app = FastAPI(
    title="Mars Habitat — Dashboard Service",
    description="Real-time event relay via WebSocket and API proxy for the frontend.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register proxy routes
app.include_router(proxy.router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for the frontend dashboard.
    Clients connect here to receive real-time sensor and actuator updates.
    """
    await ws_manager.connect(websocket)
    try:
        # Keep the connection alive — listen for client messages (e.g., pings)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "dashboard-service",
        "ws_connections": len(ws_manager.active_connections),
    }
