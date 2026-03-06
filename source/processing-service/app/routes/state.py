"""
state.py — REST API endpoints for querying the latest sensor state.

Provides endpoints to retrieve the in-memory cached sensor readings.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException

# The StateCache instance is injected from main.py via app.state
router = APIRouter(prefix="/api/state", tags=["Sensor State"])


@router.get("")
async def get_all_state():
    """
    Get the latest cached reading for every sensor.

    Returns:
        {"sensors": { "sensor_id": { ... UnifiedEvent ... }, ... }}
    """
    from app.main import state_cache  # Deferred import to avoid circular dependency
    all_state = await state_cache.get_all()
    return {"sensors": all_state}


@router.get("/{sensor_id}")
async def get_sensor_state(sensor_id: str):
    """
    Get the latest cached reading for a specific sensor.

    Returns:
        The UnifiedEvent dict for the sensor, or 404 if not yet seen.
    """
    from app.main import state_cache
    event = await state_cache.get(sensor_id)
    if event is None:
        raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found in cache")
    return event
