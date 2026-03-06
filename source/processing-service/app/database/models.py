"""
models.py — SQLAlchemy ORM models for the Processing Service.

Defines the automation_rules table used to persist if-then rules
that survive service restarts.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all ORM models."""
    pass


class AutomationRule(Base):
    """
    ORM model for the automation_rules table.

    Each row represents one if-then rule:
      IF <sensor_name>.<metric> <operator> <threshold> [unit]
      THEN set <actuator_name> to <actuator_state>
    """
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_name = Column(String(100), nullable=False, index=True)
    metric = Column(String(100), nullable=False)
    operator = Column(String(2), nullable=False)       # <, <=, =, >, >=
    threshold = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)            # Informational (e.g., "°C")
    actuator_name = Column(String(100), nullable=False)
    actuator_state = Column(String(3), nullable=False)  # "ON" or "OFF"
    enabled = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return (
            f"<Rule #{self.id}: IF {self.sensor_name}.{self.metric} "
            f"{self.operator} {self.threshold} THEN {self.actuator_name}={self.actuator_state}>"
        )
