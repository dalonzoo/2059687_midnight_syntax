"""
config.py — Environment-based configuration for the Processing Service.

All settings are read from environment variables (set in docker-compose.yml).
"""

import os

# Kafka broker address
KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# PostgreSQL connection string (async via asyncpg)
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://mars:mars@localhost:5432/mars_rules")

# Base URL of the Mars IoT simulator (for actuator POST requests)
SIMULATOR_URL: str = os.getenv("SIMULATOR_URL", "http://localhost:8080")

# Kafka topics
SENSOR_EVENTS_TOPIC: str = os.getenv("SENSOR_EVENTS_TOPIC", "sensor.events")
ACTUATOR_EVENTS_TOPIC: str = os.getenv("ACTUATOR_EVENTS_TOPIC", "actuator.events")

# Consumer group ID for this service
CONSUMER_GROUP_ID: str = os.getenv("CONSUMER_GROUP_ID", "processing-group")
