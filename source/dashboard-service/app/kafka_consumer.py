"""
kafka_consumer.py — Async Kafka consumer for the Dashboard Service.

Consumes events from sensor.events and actuator.events topics
and broadcasts them to all connected WebSocket clients in real-time.
"""

import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer

from app import config
from app.websocket_manager import WebSocketManager

logger = logging.getLogger("dashboard-service.consumer")


async def run_kafka_consumer(ws_manager: WebSocketManager):
    """
    Main Kafka consumer loop — runs as a background asyncio task.

    Subscribes to both sensor.events and actuator.events topics.
    Wraps each message in a typed envelope and broadcasts it via WebSocket.
    """
    consumer = AIOKafkaConsumer(
        config.SENSOR_EVENTS_TOPIC,
        config.ACTUATOR_EVENTS_TOPIC,
        bootstrap_servers=config.KAFKA_BOOTSTRAP_SERVERS,
        group_id=config.CONSUMER_GROUP_ID,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="latest",
    )

    # Retry connection until Kafka is available
    while True:
        try:
            await consumer.start()
            logger.info("Kafka consumer started — subscribed to: %s, %s",
                        config.SENSOR_EVENTS_TOPIC, config.ACTUATOR_EVENTS_TOPIC)
            break
        except Exception as e:
            logger.warning("Kafka not ready, retrying in 5s: %s", e)
            await asyncio.sleep(5)

    try:
        async for msg in consumer:
            # Determine message type based on the topic
            if msg.topic == config.SENSOR_EVENTS_TOPIC:
                ws_message = {
                    "type": "sensor_update",
                    "data": msg.value,
                }
            elif msg.topic == config.ACTUATOR_EVENTS_TOPIC:
                ws_message = {
                    "type": "actuator_update",
                    "data": msg.value,
                }
            else:
                continue

            # Broadcast to all connected WebSocket clients
            await ws_manager.broadcast(ws_message)

    finally:
        await consumer.stop()
        logger.info("Kafka consumer stopped.")
