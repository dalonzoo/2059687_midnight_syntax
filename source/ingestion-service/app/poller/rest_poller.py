"""
rest_poller.py — Periodic REST Sensor Polling Loop.

Polls all REST-based sensors on the Mars IoT simulator at a configurable
interval, normalizes each response into a UnifiedEvent, and publishes
the events to the Kafka sensor.events topic.
"""

import asyncio
import logging

import httpx

from app import config
from app.kafka_producer import KafkaEventProducer
from app.normalizer.event_normalizer import normalize

logger = logging.getLogger("ingestion-service.poller")


async def run_rest_polling_loop(producer: KafkaEventProducer):
    """
    Main polling loop — runs as a background asyncio task.

    Iterates over all REST sensors defined in config.REST_SENSORS,
    fetches the latest reading from the simulator, normalizes it,
    and publishes to Kafka.
    """
    logger.info(
        "REST poller started — polling %d sensors every %ds",
        len(config.REST_SENSORS),
        config.POLL_INTERVAL_SECONDS,
    )

    async with httpx.AsyncClient(
        base_url=config.SIMULATOR_URL,
        timeout=httpx.Timeout(10.0),
    ) as client:
        while True:
            for sensor_id, schema_family in config.REST_SENSORS.items():
                try:
                    # Fetch the latest reading from the simulator
                    response = await client.get(f"/api/sensors/{sensor_id}")
                    response.raise_for_status()
                    raw = response.json()

                    # Normalize into the unified event schema
                    event = normalize(
                        raw=raw,
                        schema_family=schema_family,
                        source_type="rest",
                    )

                    # Publish to Kafka, keyed by sensor_id for partition ordering
                    await producer.send(
                        topic=config.SENSOR_EVENTS_TOPIC,
                        value=event.model_dump(),
                        key=event.sensor_id,
                    )
                    logger.debug("Polled %s → published event %s", sensor_id, event.event_id)

                except httpx.HTTPError as e:
                    logger.error("HTTP error polling sensor %s: %s", sensor_id, e)
                except Exception as e:
                    logger.error("Unexpected error polling sensor %s: %s", sensor_id, e)

            # Wait before the next polling cycle
            await asyncio.sleep(config.POLL_INTERVAL_SECONDS)
