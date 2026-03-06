"""
rules.py — REST API endpoints for automation rule CRUD.

Provides endpoints to create, read, update, and delete automation rules
stored in the PostgreSQL database.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_session
from app.database import rule_repository
from app.models.rule import RuleCreate, RuleResponse, RuleUpdate

logger = logging.getLogger("processing-service.routes.rules")

router = APIRouter(prefix="/api/rules", tags=["Rules"])


@router.get("", response_model=List[RuleResponse])
async def list_rules(session: AsyncSession = Depends(get_session)):
    """List all automation rules."""
    rules = await rule_repository.get_all_rules(session)
    return rules


@router.post("", response_model=RuleResponse, status_code=201)
async def create_rule(
    data: RuleCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new automation rule."""
    # Validate operator
    if data.operator not in ("<", "<=", "=", ">", ">="):
        raise HTTPException(status_code=400, detail=f"Invalid operator: {data.operator}")
    # Validate actuator state
    if data.actuator_state not in ("ON", "OFF"):
        raise HTTPException(status_code=400, detail="actuator_state must be ON or OFF")

    rule = await rule_repository.create_rule(session, data)
    return rule


@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: int, session: AsyncSession = Depends(get_session)):
    """Get a single automation rule by ID."""
    rule = await rule_repository.get_rule_by_id(session, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    return rule


@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: int,
    data: RuleUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update an existing automation rule."""
    rule = await rule_repository.update_rule(session, rule_id, data)
    if rule is None:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    return rule


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(rule_id: int, session: AsyncSession = Depends(get_session)):
    """Delete an automation rule."""
    deleted = await rule_repository.delete_rule(session, rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
