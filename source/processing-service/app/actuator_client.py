"""
actuator_client.py — HTTP client for controlling actuators on the Mars IoT simulator.

Sends POST requests to the simulator's actuator API to change device states
(e.g., turning a cooling fan ON or OFF).
"""

import logging

import httpx

from app import config

logger = logging.getLogger("processing-service.actuator")


async def set_actuator_state(actuator_name: str, state: str) -> dict:
    """
    Send a POST request to the simulator to change an actuator's state.

    Args:
        actuator_name: Name of the actuator (e.g., "cooling_fan").
        state:         Desired state — "ON" or "OFF".

    Returns:
        The actuator response dict from the simulator.

    Raises:
        httpx.HTTPError: If the request fails.
    """
    url = f"{config.SIMULATOR_URL}/api/actuators/{actuator_name}"
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        response = await client.post(url, json={"state": state})
        response.raise_for_status()
        result = response.json()
        logger.info("Actuator %s set to %s — response: %s", actuator_name, state, result)
        return result


async def get_actuator_states() -> dict:
    """
    Fetch the current state of all actuators from the simulator.

    Returns:
        Dict like {"actuators": {"cooling_fan": "OFF", ...}}
    """
    url = f"{config.SIMULATOR_URL}/api/actuators"
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
