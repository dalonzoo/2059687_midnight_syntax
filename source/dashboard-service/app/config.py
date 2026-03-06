"""
config.py — Environment-based configuration for the Dashboard Service.
"""

import os

# Kafka broker address
KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# URL of the processing service (for API proxying)
PROCESSING_SERVICE_URL: str = os.getenv("PROCESSING_SERVICE_URL", "http://localhost:8001")

# Kafka topics to consume for real-time broadcasting
SENSOR_EVENTS_TOPIC: str = os.getenv("SENSOR_EVENTS_TOPIC", "sensor.events")
ACTUATOR_EVENTS_TOPIC: str = os.getenv("ACTUATOR_EVENTS_TOPIC", "actuator.events")

# Consumer group for this service
CONSUMER_GROUP_ID: str = os.getenv("CONSUMER_GROUP_ID", "dashboard-group")
