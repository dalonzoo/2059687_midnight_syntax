"""
config.py — Environment-based configuration for the Ingestion Service.

All settings are read from environment variables (set in docker-compose.yml).
Defaults are provided for local development.
"""

import os


# Base URL of the Mars IoT simulator container
SIMULATOR_URL: str = os.getenv("SIMULATOR_URL", "http://localhost:8080")

# Kafka broker address (comma-separated if multiple)
KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# How often to poll REST sensors (seconds)
POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))

# How often to re-discover sensors/topics from the simulator (seconds)
DISCOVERY_INTERVAL_SECONDS: int = int(os.getenv("DISCOVERY_INTERVAL_SECONDS", "30"))

# Kafka topic where normalized sensor events are published
SENSOR_EVENTS_TOPIC: str = os.getenv("SENSOR_EVENTS_TOPIC", "sensor.events")

# --------------------------------------------------------------------------
# Sensor and topic registries — maps sensor_id → schema family
# --------------------------------------------------------------------------

# REST sensors to poll (sensor_id → schema_family)
REST_SENSORS: dict[str, str] = {
    "greenhouse_temperature": "rest.scalar.v1",
    "entrance_humidity":      "rest.scalar.v1",
    "co2_hall":               "rest.scalar.v1",
    "corridor_pressure":      "rest.scalar.v1",
    "hydroponic_ph":          "rest.chemistry.v1",
    "water_tank_level":       "rest.level.v1",
    "air_quality_pm25":       "rest.particulate.v1",
    "air_quality_voc":        "rest.chemistry.v1",
}

# Telemetry SSE topics to subscribe to (topic → schema_family)
TELEMETRY_TOPICS: dict[str, str] = {
    "mars/telemetry/solar_array":        "topic.power.v1",
    "mars/telemetry/radiation":          "topic.environment.v1",
    "mars/telemetry/life_support":       "topic.environment.v1",
    "mars/telemetry/thermal_loop":       "topic.thermal_loop.v1",
    "mars/telemetry/power_bus":          "topic.power.v1",
    "mars/telemetry/power_consumption":  "topic.power.v1",
    "mars/telemetry/airlock":            "topic.airlock.v1",
}
