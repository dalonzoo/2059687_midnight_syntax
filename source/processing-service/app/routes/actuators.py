"""
actuators.py — REST API endpoints for actuator state management.

Proxies actuator queries and commands to the Mars IoT simulator.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.actuator_client import get_actuator_states, set_actuator_state

router = APIRouter(prefix="/api/actuators", tags=["Actuators"])


class ActuatorCommand(BaseModel):
    """Request body to set an actuator state."""
    state: str  # "ON" or "OFF"


@router.get("")
async def list_actuators():
    """Get the current state of all actuators from the simulator."""
    try:
        return await get_actuator_states()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Simulator unreachable: {e}")


@router.post("/{actuator_name}")
async def control_actuator(actuator_name: str, command: ActuatorCommand):
    """Set an actuator's state (ON/OFF) on the simulator."""
    if command.state not in ("ON", "OFF"):
        raise HTTPException(status_code=400, detail="state must be ON or OFF")
    try:
        result = await set_actuator_state(actuator_name, command.state)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to control actuator: {e}")
