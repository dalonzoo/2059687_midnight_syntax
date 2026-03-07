"""
telemetry_streamer.py — SSE Telemetry Stream Consumers.

Opens Server-Sent Event (SSE) connections to the Mars IoT simulator
for each telemetry topic. Each event is normalized into a UnifiedEvent
and published to the Kafka sensor.events topic.

Each topic runs in its own asyncio task with automatic reconnection.
"""

import asyncio
import json
import logging

import httpx

from app import config
from app.kafka_producer import KafkaEventProducer
from app.normalizer.event_normalizer import normalize

logger = logging.getLogger("ingestion-service.streamer")

# Reconnection delay after SSE disconnection (seconds)
RECONNECT_DELAY = 3


async def _stream_single_topic(
    topic: str,
    schema_family: str,
    producer: KafkaEventProducer,
):
    """
    Connect to a single SSE telemetry topic and consume events indefinitely.
    Automatically reconnects on disconnection or error.

    Args:
        topic:         The telemetry topic path (e.g., "mars/telemetry/solar_array").
        schema_family: The schema family for normalization (e.g., "topic.power.v1").
        producer:      Kafka producer to publish normalized events.
    """
    url = f"{config.SIMULATOR_URL}/api/telemetry/stream/{topic}"
    logger.info("Subscribing to SSE stream: %s (schema: %s)", topic, schema_family)

    while True:
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("GET", url) as response:
                    response.raise_for_status()
                    buffer = ""
                    async for chunk in response.aiter_text():
                        buffer += chunk
                        # SSE events are separated by double newlines
                        while "\n\n" in buffer:
                            event_text, buffer = buffer.split("\n\n", 1)
                            data = _parse_sse_event(event_text)
                            if data is None:
                                continue

                            # Normalize and publish
                            event = normalize(
                                raw=data,
                                schema_family=schema_family,
                                source_type="telemetry",
                                raw_topic=topic,
                            )
                            await producer.send(
                                topic=config.SENSOR_EVENTS_TOPIC,
                                value=event.model_dump(),
                                key=event.sensor_id,
                            )
                            logger.debug(
                                "Stream %s → published event %s", topic, event.event_id
                            )

        except httpx.HTTPError as e:
            logger.error("SSE stream %s HTTP error: %s — reconnecting in %ds", topic, e, RECONNECT_DELAY)
        except Exception as e:
            logger.error("SSE stream %s error: %s — reconnecting in %ds", topic, e, RECONNECT_DELAY)

        await asyncio.sleep(RECONNECT_DELAY)


def _parse_sse_event(event_text: str) -> dict | None:
    """
    Parse a raw SSE event block into a JSON dict.

    SSE format:
        event: telemetry
        data: {"key": "value", ...}

    Returns None if no valid data line is found.
    """
    for line in event_text.strip().splitlines():
        if line.startswith("data:"):
            json_str = line[len("data:"):].strip()
            if json_str:
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON in SSE data: %s", json_str[:100])
    return None


async def run_telemetry_streams(producer: KafkaEventProducer):
    """
    Manage telemetry stream consumers.  Monitors config.TELEMETRY_TOPICS for
    new entries (added by the discovery loop) and spawns a stream task for each.
    """
    logger.info("Telemetry stream manager started.")
    active_topics: set[str] = set()

    while True:
        for topic, schema_family in dict(config.TELEMETRY_TOPICS).items():
            if topic not in active_topics:
                active_topics.add(topic)
                asyncio.create_task(
                    _stream_single_topic(topic, schema_family, producer),
                    name=f"sse-{topic}",
                )
                logger.info("Spawned stream consumer for: %s (schema: %s)", topic, schema_family)
        await asyncio.sleep(5)
