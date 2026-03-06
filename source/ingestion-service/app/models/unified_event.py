"""
unified_event.py — Unified internal event schema (Pydantic models).

All heterogeneous sensor data (REST + telemetry) is normalized into
the UnifiedEvent format before publishing to Kafka. This is the core
data contract of the entire platform.
"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class Measurement(BaseModel):
    """
    A single metric reading.

    Attributes:
        metric: Name of the measurement (e.g., "temperature", "power_kw").
        value:  Numeric value of the reading.
        unit:   Unit of measurement (e.g., "°C", "kW", "µg/m³").
    """
    metric: str
    value: float
    unit: str


class UnifiedEvent(BaseModel):
    """
    Unified internal event schema.

    Every sensor reading — regardless of source type or schema family —
    is normalized to this format before being published to Kafka.

    Attributes:
        event_id:      Unique identifier for this event (UUID v4).
        source_type:   Origin type — "rest" for polled sensors, "telemetry" for streamed topics.
        sensor_id:     Logical sensor identifier (e.g., "greenhouse_temperature", "solar_array").
        schema_family: Original schema type (e.g., "rest.scalar.v1", "topic.power.v1").
        timestamp:     ISO 8601 datetime string from the source data.
        measurements:  List of metric readings extracted from the raw payload.
        status:        Sensor status — "ok" or "warning".
        raw_topic:     Original telemetry topic name (null for REST sensors).
        metadata:      Optional additional data from the source.
    """
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    source_type: str            # "rest" or "telemetry"
    sensor_id: str
    schema_family: str
    timestamp: str
    measurements: List[Measurement]
    status: str = "ok"
    raw_topic: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
