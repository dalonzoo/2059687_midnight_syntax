"""
discovery.py — Auto-discovery of sensors and telemetry topics.

Queries the simulator's /api/sensors and /api/telemetry/topics endpoints
to detect available sensors and topics at runtime, removing the need for
hardcoded sensor registries.  Unknown sensors are probed to infer their
schema family so the normalizer can handle them correctly.
"""

import asyncio
import logging

import httpx

from app import config

logger = logging.getLogger("ingestion-service.discovery")

# ---------------------------------------------------------------------------
# Known schema hints — pre-mapped sensors/topics with verified schema families.
# Discovery uses these first; unknown sensors are probed to infer their schema.
# ---------------------------------------------------------------------------

_KNOWN_REST_SCHEMAS: dict[str, str] = {
    "greenhouse_temperature": "rest.scalar.v1",
    "entrance_humidity":      "rest.scalar.v1",
    "co2_hall":               "rest.scalar.v1",
    "corridor_pressure":      "rest.scalar.v1",
    "hydroponic_ph":          "rest.chemistry.v1",
    "water_tank_level":       "rest.level.v1",
    "air_quality_pm25":       "rest.particulate.v1",
    "air_quality_voc":        "rest.chemistry.v1",
}

_KNOWN_TELEMETRY_SCHEMAS: dict[str, str] = {
    "mars/telemetry/solar_array":        "topic.power.v1",
    "mars/telemetry/radiation":          "topic.environment.v1",
    "mars/telemetry/life_support":       "topic.environment.v1",
    "mars/telemetry/thermal_loop":       "topic.thermal_loop.v1",
    "mars/telemetry/power_bus":          "topic.power.v1",
    "mars/telemetry/power_consumption":  "topic.power.v1",
    "mars/telemetry/airlock":            "topic.airlock.v1",
}


# ---------------------------------------------------------------------------
# Schema inference
# ---------------------------------------------------------------------------

async def _infer_rest_schema(client: httpx.AsyncClient, sensor_id: str) -> str:
    """Fetch one sample reading and infer schema family from its structure."""
    try:
        resp = await client.get(f"/api/sensors/{sensor_id}")
        resp.raise_for_status()
        raw = resp.json()
        if "measurements" in raw and isinstance(raw["measurements"], list):
            return "rest.chemistry.v1"
        if "pm1_ug_m3" in raw:
            return "rest.particulate.v1"
        if "level_pct" in raw:
            return "rest.level.v1"
        return "rest.scalar.v1"
    except Exception as e:
        logger.warning("Schema probe failed for %s: %s — using rest.scalar.v1", sensor_id, e)
        return "rest.scalar.v1"


def _infer_telemetry_schema(topic: str) -> str:
    """Infer telemetry schema family from the topic path."""
    segment = topic.rsplit("/", 1)[-1].lower()
    if any(kw in segment for kw in ("power", "solar", "consumption")):
        return "topic.power.v1"
    if "thermal" in segment:
        return "topic.thermal_loop.v1"
    if "airlock" in segment:
        return "topic.airlock.v1"
    return "topic.environment.v1"


# ---------------------------------------------------------------------------
# Discovery queries
# ---------------------------------------------------------------------------

async def discover_rest_sensors(client: httpx.AsyncClient) -> dict[str, str]:
    """Query /api/sensors and return {sensor_id: schema_family}."""
    resp = await client.get("/api/sensors")
    resp.raise_for_status()
    sensor_ids = resp.json().get("sensors", [])

    registry: dict[str, str] = {}
    for sid in sensor_ids:
        if sid in _KNOWN_REST_SCHEMAS:
            registry[sid] = _KNOWN_REST_SCHEMAS[sid]
        else:
            registry[sid] = await _infer_rest_schema(client, sid)
            logger.info("Auto-discovered REST sensor: %s → %s", sid, registry[sid])
    return registry


async def discover_telemetry_topics(client: httpx.AsyncClient) -> dict[str, str]:
    """Query /api/telemetry/topics and return {topic: schema_family}."""
    resp = await client.get("/api/telemetry/topics")
    resp.raise_for_status()
    topics = resp.json().get("topics", [])

    registry: dict[str, str] = {}
    for topic in topics:
        if topic in _KNOWN_TELEMETRY_SCHEMAS:
            registry[topic] = _KNOWN_TELEMETRY_SCHEMAS[topic]
        else:
            registry[topic] = _infer_telemetry_schema(topic)
            logger.info("Auto-discovered telemetry topic: %s → %s", topic, registry[topic])
    return registry


# ---------------------------------------------------------------------------
# Startup + periodic discovery
# ---------------------------------------------------------------------------

async def initial_discovery() -> tuple[dict[str, str], dict[str, str]]:
    """One-shot discovery at startup.  Returns (rest_sensors, telemetry_topics)."""
    async with httpx.AsyncClient(
        base_url=config.SIMULATOR_URL,
        timeout=httpx.Timeout(10.0),
    ) as client:
        rest = await discover_rest_sensors(client)
        tele = await discover_telemetry_topics(client)
    return rest, tele


async def run_discovery_loop():
    """
    Periodically re-discover sensors and topics from the simulator.
    Updates config.REST_SENSORS and config.TELEMETRY_TOPICS in place
    so the poller and streamer pick up new entries automatically.
    """
    async with httpx.AsyncClient(
        base_url=config.SIMULATOR_URL,
        timeout=httpx.Timeout(10.0),
    ) as client:
        while True:
            await asyncio.sleep(config.DISCOVERY_INTERVAL_SECONDS)
            try:
                rest = await discover_rest_sensors(client)
                for sid, schema in rest.items():
                    if sid not in config.REST_SENSORS:
                        config.REST_SENSORS[sid] = schema
                        logger.info("Discovered new REST sensor: %s → %s", sid, schema)

                tele = await discover_telemetry_topics(client)
                for topic, schema in tele.items():
                    if topic not in config.TELEMETRY_TOPICS:
                        config.TELEMETRY_TOPICS[topic] = schema
                        logger.info("Discovered new telemetry topic: %s → %s", topic, schema)
            except Exception as e:
                logger.warning("Discovery cycle error: %s", e)
