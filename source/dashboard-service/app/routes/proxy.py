"""
proxy.py — API proxy routes for the Dashboard Service.

Forwards REST API calls from the frontend to the Processing Service.
This keeps the frontend talking to a single backend (dashboard-service),
which then routes requests internally.
"""

import logging

import httpx
from fastapi import APIRouter, HTTPException, Request, Response

from app import config

logger = logging.getLogger("dashboard-service.proxy")

router = APIRouter(prefix="/api", tags=["Proxy"])

# Reusable HTTP client for proxying requests
_client = httpx.AsyncClient(
    base_url=config.PROCESSING_SERVICE_URL,
    timeout=httpx.Timeout(10.0),
)


async def _proxy(method: str, path: str, request: Request) -> Response:
    """
    Generic proxy helper — forwards a request to the processing service
    and returns the response to the frontend.
    """
    url = f"/api{path}"
    body = await request.body()
    headers = {"Content-Type": request.headers.get("Content-Type", "application/json")}

    try:
        resp = await _client.request(method, url, content=body, headers=headers)
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers={"Content-Type": resp.headers.get("Content-Type", "application/json")},
        )
    except httpx.HTTPError as e:
        logger.error("Proxy error [%s %s]: %s", method, url, e)
        raise HTTPException(status_code=502, detail="Processing service unreachable")


# ---- Rules CRUD ----

@router.get("/rules")
async def proxy_list_rules(request: Request):
    return await _proxy("GET", "/rules", request)


@router.post("/rules")
async def proxy_create_rule(request: Request):
    return await _proxy("POST", "/rules", request)


@router.get("/rules/{rule_id}")
async def proxy_get_rule(rule_id: int, request: Request):
    return await _proxy("GET", f"/rules/{rule_id}", request)


@router.put("/rules/{rule_id}")
async def proxy_update_rule(rule_id: int, request: Request):
    return await _proxy("PUT", f"/rules/{rule_id}", request)


@router.delete("/rules/{rule_id}")
async def proxy_delete_rule(rule_id: int, request: Request):
    return await _proxy("DELETE", f"/rules/{rule_id}", request)


# ---- Sensor State ----

@router.get("/state")
async def proxy_get_state(request: Request):
    return await _proxy("GET", "/state", request)


@router.get("/state/{sensor_id}")
async def proxy_get_sensor(sensor_id: str, request: Request):
    return await _proxy("GET", f"/state/{sensor_id}", request)


# ---- Actuators ----

@router.get("/actuators")
async def proxy_get_actuators(request: Request):
    return await _proxy("GET", "/actuators", request)


@router.post("/actuators/{actuator_name}")
async def proxy_control_actuator(actuator_name: str, request: Request):
    return await _proxy("POST", f"/actuators/{actuator_name}", request)
