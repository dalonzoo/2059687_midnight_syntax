"""
unified_event.py — Unified event schema (shared Pydantic model).

Duplicated from ingestion-service for decoupling. Both services use
the same schema; in a production system this would be a shared library.
"""

from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class Measurement(BaseModel):
    """A single metric reading with its value and unit."""
    metric: str
    value: float
    unit: str


class UnifiedEvent(BaseModel):
    """Unified internal event schema — deserialized from Kafka messages."""
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    source_type: str
    sensor_id: str
    schema_family: str
    timestamp: str
    measurements: List[Measurement]
    status: str = "ok"
    raw_topic: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
