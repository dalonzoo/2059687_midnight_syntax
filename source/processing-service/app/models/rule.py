"""
rule.py — Pydantic models for automation rule API request/response.

These models define the shape of data exchanged over the Rules CRUD API.
The SQLAlchemy ORM model (database/models.py) handles persistence.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RuleCreate(BaseModel):
    """
    Request body for creating a new automation rule.

    Example:
        IF greenhouse_temperature.temperature > 28 °C THEN set cooling_fan to ON
    """
    sensor_name: str        # e.g., "greenhouse_temperature"
    metric: str             # e.g., "temperature" — which measurement to compare
    operator: str           # one of: <, <=, =, >, >=
    threshold: float        # e.g., 28.0
    unit: Optional[str] = None        # e.g., "°C" (informational only)
    actuator_name: str      # e.g., "cooling_fan"
    actuator_state: str     # "ON" or "OFF"


class RuleUpdate(BaseModel):
    """Request body for updating an existing rule (all fields optional)."""
    sensor_name: Optional[str] = None
    metric: Optional[str] = None
    operator: Optional[str] = None
    threshold: Optional[float] = None
    unit: Optional[str] = None
    actuator_name: Optional[str] = None
    actuator_state: Optional[str] = None
    enabled: Optional[bool] = None


class RuleResponse(BaseModel):
    """Response model for a single automation rule."""
    id: int
    sensor_name: str
    metric: str
    operator: str
    threshold: float
    unit: Optional[str] = None
    actuator_name: str
    actuator_state: str
    enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
