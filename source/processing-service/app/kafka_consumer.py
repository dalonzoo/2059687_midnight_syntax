"""
kafka_consumer.py — Async Kafka consumer for the Processing Service.

Consumes normalized events from the sensor.events topic, updates the
in-memory state cache, evaluates automation rules, and triggers actuator
commands when conditions are met.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app import config
from app.actuator_client import set_actuator_state
from app.database.connection import async_session_factory
from app.database.rule_repository import get_enabled_rules
from app.rule_engine.evaluator import evaluate_rule
from app.state_cache import StateCache

logger = logging.getLogger("processing-service.consumer")


async def run_kafka_consumer(state_cache: StateCache):
    """
    Main Kafka consumer loop — runs as a background asyncio task.

    For each event from sensor.events:
      1. Update the in-memory state cache.
      2. Load enabled rules matching the event's sensor_id.
      3. Evaluate each rule; if triggered, POST to the actuator and
         publish the result to actuator.events.
    """
    consumer = AIOKafkaConsumer(
        config.SENSOR_EVENTS_TOPIC,
        bootstrap_servers=config.KAFKA_BOOTSTRAP_SERVERS,
        group_id=config.CONSUMER_GROUP_ID,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="latest",
    )

    producer = AIOKafkaProducer(
        bootstrap_servers=config.KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda k: k.encode("utf-8") if k else None,
    )

    # Retry connection until Kafka is available
    while True:
        try:
            await consumer.start()
            await producer.start()
            logger.info("Kafka consumer started on topic: %s", config.SENSOR_EVENTS_TOPIC)
            break
        except Exception as e:
            logger.warning("Kafka not ready, retrying in 5s: %s", e)
            await asyncio.sleep(5)

    try:
        async for msg in consumer:
            event = msg.value
            sensor_id = event.get("sensor_id", "unknown")

            # 1. Update in-memory state cache
            await state_cache.update(sensor_id, event)

            # 2 & 3. Evaluate rules
            try:
                async with async_session_factory() as session:
                    rules = await get_enabled_rules(session)

                for rule in rules:
                    if evaluate_rule(rule, event):
                        # Rule triggered — send actuator command
                        try:
                            result = await set_actuator_state(
                                rule.actuator_name, rule.actuator_state
                            )

                            # Publish actuator event to Kafka
                            actuator_event = {
                                "actuator_name": rule.actuator_name,
                                "state": rule.actuator_state,
                                "triggered_by_rule": rule.id,
                                "sensor_id": sensor_id,
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                            }
                            await producer.send_and_wait(
                                config.ACTUATOR_EVENTS_TOPIC,
                                value=actuator_event,
                                key=rule.actuator_name,
                            )
                        except Exception as e:
                            logger.error(
                                "Failed to execute actuator command for rule #%d: %s",
                                rule.id, e,
                            )

            except Exception as e:
                logger.error("Rule evaluation error for event %s: %s", sensor_id, e)

    finally:
        await consumer.stop()
        await producer.stop()
        logger.info("Kafka consumer stopped.")
