"""
main.py — FastAPI entry point for the Ingestion Service.

On startup, launches background tasks that:
  1. Poll all REST sensors on the simulator at a fixed interval.
  2. Open SSE connections to all telemetry topics.
Each reading is normalized into a UnifiedEvent and published to Kafka.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import config
from app.discovery import initial_discovery, run_discovery_loop
from app.kafka_producer import KafkaEventProducer
from app.poller.rest_poller import run_rest_polling_loop
from app.streamer.telemetry_streamer import run_telemetry_streams

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("ingestion-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown of background tasks.
    - Starts the Kafka producer.
    - Launches the REST polling loop.
    - Launches SSE telemetry stream consumers.
    """
    logger.info("Starting Ingestion Service...")

    # Discover available sensors and telemetry topics from the simulator
    try:
        rest, tele = await initial_discovery()
        if rest:
            config.REST_SENSORS = rest
            logger.info("Discovered %d REST sensors", len(rest))
        if tele:
            config.TELEMETRY_TOPICS = tele
            logger.info("Discovered %d telemetry topics", len(tele))
    except Exception as e:
        logger.warning("Initial discovery failed, using defaults: %s", e)

    # Initialize the Kafka producer
    producer = KafkaEventProducer(config.KAFKA_BOOTSTRAP_SERVERS)
    await producer.start()
    logger.info("Kafka producer connected to %s", config.KAFKA_BOOTSTRAP_SERVERS)

    # Launch background tasks
    tasks = []
    tasks.append(asyncio.create_task(run_rest_polling_loop(producer)))
    tasks.append(asyncio.create_task(run_telemetry_streams(producer)))
    tasks.append(asyncio.create_task(run_discovery_loop()))
    logger.info("Background ingestion tasks launched.")

    yield  # Application is running

    # Shutdown: cancel background tasks and close producer
    logger.info("Shutting down Ingestion Service...")
    for task in tasks:
        task.cancel()
    await producer.stop()
    logger.info("Ingestion Service stopped.")


app = FastAPI(
    title="Mars Habitat — Ingestion Service",
    description="Collects sensor data from the Mars IoT simulator and publishes normalized events to Kafka.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "ingestion-service"}
