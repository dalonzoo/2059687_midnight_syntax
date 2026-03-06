"""
event_normalizer.py — Transforms raw simulator payloads into UnifiedEvent objects.

Each schema family from the Mars IoT simulator has a dedicated normalization
function that extracts measurements and maps fields to the unified format.
"""

import logging
from typing import Optional

from app.models.unified_event import Measurement, UnifiedEvent

logger = logging.getLogger("ingestion-service.normalizer")


def normalize(raw: dict, schema_family: str, source_type: str,
              raw_topic: Optional[str] = None) -> UnifiedEvent:
    """
    Normalize a raw simulator payload into a UnifiedEvent.

    Args:
        raw:           Raw JSON dict from the simulator.
        schema_family: Schema identifier (e.g., "rest.scalar.v1").
        source_type:   "rest" or "telemetry".
        raw_topic:     Original telemetry topic (None for REST).

    Returns:
        A UnifiedEvent with extracted measurements.
    """
    normalizer_fn = _NORMALIZERS.get(schema_family)
    if not normalizer_fn:
        logger.warning("Unknown schema family: %s — passing raw data through", schema_family)
        return _fallback(raw, schema_family, source_type, raw_topic)

    return normalizer_fn(raw, schema_family, source_type, raw_topic)


# ==========================================================================
# REST schema normalizers
# ==========================================================================

def _normalize_rest_scalar(raw: dict, schema_family: str, source_type: str,
                           raw_topic: Optional[str]) -> UnifiedEvent:
    """
    rest.scalar.v1 — Single-value sensors (temperature, humidity, co2, pressure).
    Fields: sensor_id, captured_at, metric, value, unit, status
    """
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw["sensor_id"],
        schema_family=schema_family,
        timestamp=raw["captured_at"],
        measurements=[
            Measurement(metric=raw["metric"], value=raw["value"], unit=raw["unit"])
        ],
        status=raw.get("status", "ok"),
        raw_topic=raw_topic,
    )


def _normalize_rest_chemistry(raw: dict, schema_family: str, source_type: str,
                              raw_topic: Optional[str]) -> UnifiedEvent:
    """
    rest.chemistry.v1 — Multi-measurement sensors (pH, VOC).
    Fields: sensor_id, captured_at, measurements[], status
    """
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw["sensor_id"],
        schema_family=schema_family,
        timestamp=raw["captured_at"],
        measurements=[
            Measurement(metric=m["metric"], value=m["value"], unit=m["unit"])
            for m in raw["measurements"]
        ],
        status=raw.get("status", "ok"),
        raw_topic=raw_topic,
    )


def _normalize_rest_particulate(raw: dict, schema_family: str, source_type: str,
                                raw_topic: Optional[str]) -> UnifiedEvent:
    """
    rest.particulate.v1 — Particulate matter sensor (PM1, PM2.5, PM10).
    Fields: sensor_id, captured_at, pm1_ug_m3, pm25_ug_m3, pm10_ug_m3, status
    """
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw["sensor_id"],
        schema_family=schema_family,
        timestamp=raw["captured_at"],
        measurements=[
            Measurement(metric="pm1_ug_m3",  value=raw["pm1_ug_m3"],  unit="µg/m³"),
            Measurement(metric="pm25_ug_m3", value=raw["pm25_ug_m3"], unit="µg/m³"),
            Measurement(metric="pm10_ug_m3", value=raw["pm10_ug_m3"], unit="µg/m³"),
        ],
        status=raw.get("status", "ok"),
        raw_topic=raw_topic,
    )


def _normalize_rest_level(raw: dict, schema_family: str, source_type: str,
                          raw_topic: Optional[str]) -> UnifiedEvent:
    """
    rest.level.v1 — Water tank level sensor.
    Fields: sensor_id, captured_at, level_pct, level_liters, status
    """
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw["sensor_id"],
        schema_family=schema_family,
        timestamp=raw["captured_at"],
        measurements=[
            Measurement(metric="level_pct",    value=raw["level_pct"],    unit="%"),
            Measurement(metric="level_liters", value=raw["level_liters"], unit="L"),
        ],
        status=raw.get("status", "ok"),
        raw_topic=raw_topic,
    )


# ==========================================================================
# Telemetry schema normalizers
# ==========================================================================

def _normalize_topic_power(raw: dict, schema_family: str, source_type: str,
                           raw_topic: Optional[str]) -> UnifiedEvent:
    """
    topic.power.v1 — Power subsystems (solar, bus, consumption).
    Fields: topic, event_time, subsystem, power_kw, voltage_v, current_a, cumulative_kwh
    """
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw["subsystem"],
        schema_family=schema_family,
        timestamp=raw["event_time"],
        measurements=[
            Measurement(metric="power_kw",       value=raw["power_kw"],       unit="kW"),
            Measurement(metric="voltage_v",      value=raw["voltage_v"],      unit="V"),
            Measurement(metric="current_a",      value=raw["current_a"],      unit="A"),
            Measurement(metric="cumulative_kwh", value=raw["cumulative_kwh"], unit="kWh"),
        ],
        status="ok",
        raw_topic=raw.get("topic", raw_topic),
    )


def _normalize_topic_environment(raw: dict, schema_family: str, source_type: str,
                                 raw_topic: Optional[str]) -> UnifiedEvent:
    """
    topic.environment.v1 — Environment subsystems (radiation, life support).
    Fields: topic, event_time, source{system, segment}, measurements[], status
    """
    sensor_id = raw.get("source", {}).get("system", "unknown")
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=sensor_id,
        schema_family=schema_family,
        timestamp=raw["event_time"],
        measurements=[
            Measurement(metric=m["metric"], value=m["value"], unit=m["unit"])
            for m in raw["measurements"]
        ],
        status=raw.get("status", "ok"),
        raw_topic=raw.get("topic", raw_topic),
        metadata={"segment": raw.get("source", {}).get("segment", "")},
    )


def _normalize_topic_thermal_loop(raw: dict, schema_family: str, source_type: str,
                                  raw_topic: Optional[str]) -> UnifiedEvent:
    """
    topic.thermal_loop.v1 — Thermal loop monitoring.
    Fields: topic, event_time, loop, temperature_c, flow_l_min, status
    """
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw["loop"],
        schema_family=schema_family,
        timestamp=raw["event_time"],
        measurements=[
            Measurement(metric="temperature_c", value=raw["temperature_c"], unit="°C"),
            Measurement(metric="flow_l_min",    value=raw["flow_l_min"],    unit="L/min"),
        ],
        status=raw.get("status", "ok"),
        raw_topic=raw.get("topic", raw_topic),
    )


def _normalize_topic_airlock(raw: dict, schema_family: str, source_type: str,
                             raw_topic: Optional[str]) -> UnifiedEvent:
    """
    topic.airlock.v1 — Airlock status.
    Fields: topic, event_time, airlock_id, cycles_per_hour, last_state
    """
    # Encode last_state as a numeric value for the measurement list:
    # IDLE=0, PRESSURIZING=1, DEPRESSURIZING=2
    state_map = {"IDLE": 0, "PRESSURIZING": 1, "DEPRESSURIZING": 2}
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw["airlock_id"],
        schema_family=schema_family,
        timestamp=raw["event_time"],
        measurements=[
            Measurement(metric="cycles_per_hour", value=raw["cycles_per_hour"], unit="cycles/h"),
        ],
        status="ok",
        raw_topic=raw.get("topic", raw_topic),
        metadata={"last_state": raw.get("last_state", "IDLE")},
    )


# ==========================================================================
# Fallback normalizer
# ==========================================================================

def _fallback(raw: dict, schema_family: str, source_type: str,
              raw_topic: Optional[str]) -> UnifiedEvent:
    """Fallback for unknown schemas — wraps the entire raw payload in metadata."""
    return UnifiedEvent(
        source_type=source_type,
        sensor_id=raw.get("sensor_id", raw.get("subsystem", "unknown")),
        schema_family=schema_family,
        timestamp=raw.get("captured_at", raw.get("event_time", "")),
        measurements=[],
        status=raw.get("status", "ok"),
        raw_topic=raw_topic,
        metadata=raw,
    )


# ==========================================================================
# Schema family → normalizer function mapping
# ==========================================================================

_NORMALIZERS = {
    # REST schemas
    "rest.scalar.v1":        _normalize_rest_scalar,
    "rest.chemistry.v1":     _normalize_rest_chemistry,
    "rest.particulate.v1":   _normalize_rest_particulate,
    "rest.level.v1":         _normalize_rest_level,
    # Telemetry schemas
    "topic.power.v1":        _normalize_topic_power,
    "topic.environment.v1":  _normalize_topic_environment,
    "topic.thermal_loop.v1": _normalize_topic_thermal_loop,
    "topic.airlock.v1":      _normalize_topic_airlock,
}
