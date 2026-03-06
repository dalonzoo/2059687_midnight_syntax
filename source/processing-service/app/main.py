"""
main.py — FastAPI entry point for the Processing Service.

On startup:
  - Initializes the database (creates tables if needed).
  - Launches a background Kafka consumer that processes sensor events,
    evaluates automation rules, and triggers actuator commands.
  - Exposes REST APIs for rules CRUD, sensor state, and actuator control.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database.connection import init_db
from app.kafka_consumer import run_kafka_consumer
from app.state_cache import StateCache
from app.routes import rules, state, actuators

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("processing-service")

# Global in-memory state cache (shared across routes and Kafka consumer)
state_cache = StateCache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown:
    - Creates database tables.
    - Starts the Kafka consumer background task.
    """
    logger.info("Starting Processing Service...")

    # Initialize database
    await init_db()
    logger.info("Database initialized.")

    # Launch Kafka consumer as background task
    consumer_task = asyncio.create_task(run_kafka_consumer(state_cache))
    logger.info("Kafka consumer task launched.")

    yield  # Application is running

    # Shutdown
    logger.info("Shutting down Processing Service...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    logger.info("Processing Service stopped.")


app = FastAPI(
    title="Mars Habitat — Processing Service",
    description="Evaluates automation rules, manages sensor state, and controls actuators.",
    version="1.0.0",
    lifespan=lifespan,
)

# Register route modules
app.include_router(rules.router)
app.include_router(state.router)
app.include_router(actuators.router)


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "processing-service"}
