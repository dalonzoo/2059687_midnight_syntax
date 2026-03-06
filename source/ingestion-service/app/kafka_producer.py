"""
kafka_producer.py — Async Kafka producer wrapper for the Ingestion Service.

Provides a simple interface to publish JSON-serialized events to a Kafka topic.
Uses aiokafka for non-blocking async production.
"""

import json
import logging

from aiokafka import AIOKafkaProducer

logger = logging.getLogger("ingestion-service.kafka")


class KafkaEventProducer:
    """
    Wraps an aiokafka producer, providing start/stop lifecycle and
    a simple send() method for publishing events to Kafka topics.
    """

    def __init__(self, bootstrap_servers: str):
        self._producer = AIOKafkaProducer(
            bootstrap_servers=bootstrap_servers,
            # Serialize values as UTF-8 JSON strings
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            # Use sensor_id as the key for partition ordering
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )

    async def start(self):
        """Start the Kafka producer (connect to broker)."""
        await self._producer.start()

    async def stop(self):
        """Flush pending messages and close the producer."""
        await self._producer.stop()

    async def send(self, topic: str, value: dict, key: str | None = None):
        """
        Publish a single event to a Kafka topic.

        Args:
            topic: Kafka topic name (e.g., "sensor.events").
            value: Dict payload to serialize as JSON.
            key:   Optional partition key (e.g., sensor_id).
        """
        await self._producer.send_and_wait(topic, value=value, key=key)
        logger.debug("Published event to %s [key=%s]", topic, key)
