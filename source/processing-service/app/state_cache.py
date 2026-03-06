"""
state_cache.py — In-memory cache for the latest sensor state.

Stores the most recent UnifiedEvent for each sensor_id.
Provides thread-safe async access for reading and updating state.
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger("processing-service.cache")


class StateCache:
    """
    In-memory cache of the latest reading per sensor.

    Keys are sensor_id strings, values are UnifiedEvent dicts.
    No persistence — this is purely volatile state.
    """

    def __init__(self):
        self._cache: dict[str, dict] = {}
        self._lock = asyncio.Lock()

    async def update(self, sensor_id: str, event: dict):
        """Update the cached state for a sensor with the latest event."""
        async with self._lock:
            self._cache[sensor_id] = event
            logger.debug("State cache updated for sensor: %s", sensor_id)

    async def get_all(self) -> dict[str, dict]:
        """Return a snapshot of all cached sensor states."""
        async with self._lock:
            return dict(self._cache)

    async def get(self, sensor_id: str) -> Optional[dict]:
        """Return the latest cached event for a specific sensor, or None."""
        async with self._lock:
            return self._cache.get(sensor_id)
