"""
rule_repository.py — CRUD operations for automation rules.

Provides async functions for creating, reading, updating, and deleting
rules from the PostgreSQL automation_rules table.
"""

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import AutomationRule
from app.models.rule import RuleCreate, RuleUpdate

logger = logging.getLogger("processing-service.repository")


async def get_all_rules(session: AsyncSession) -> list[AutomationRule]:
    """Fetch all automation rules from the database."""
    result = await session.execute(select(AutomationRule))
    return list(result.scalars().all())


async def get_enabled_rules(session: AsyncSession) -> list[AutomationRule]:
    """Fetch only enabled rules (used for rule evaluation)."""
    result = await session.execute(
        select(AutomationRule).where(AutomationRule.enabled == True)
    )
    return list(result.scalars().all())


async def get_rule_by_id(session: AsyncSession, rule_id: int) -> Optional[AutomationRule]:
    """Fetch a single rule by its ID. Returns None if not found."""
    result = await session.execute(
        select(AutomationRule).where(AutomationRule.id == rule_id)
    )
    return result.scalar_one_or_none()


async def create_rule(session: AsyncSession, data: RuleCreate) -> AutomationRule:
    """Create a new automation rule and persist it to the database."""
    rule = AutomationRule(
        sensor_name=data.sensor_name,
        metric=data.metric,
        operator=data.operator,
        threshold=data.threshold,
        unit=data.unit,
        actuator_name=data.actuator_name,
        actuator_state=data.actuator_state,
    )
    session.add(rule)
    await session.flush()   # Populate the auto-generated ID
    await session.refresh(rule)
    logger.info("Created rule #%d: %s", rule.id, rule)
    return rule


async def update_rule(session: AsyncSession, rule_id: int, data: RuleUpdate) -> Optional[AutomationRule]:
    """Update an existing rule. Returns None if the rule doesn't exist."""
    rule = await get_rule_by_id(session, rule_id)
    if rule is None:
        return None

    # Apply only the fields that were provided in the update request
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    await session.flush()
    await session.refresh(rule)
    logger.info("Updated rule #%d: %s", rule.id, rule)
    return rule


async def delete_rule(session: AsyncSession, rule_id: int) -> bool:
    """Delete a rule by ID. Returns True if deleted, False if not found."""
    rule = await get_rule_by_id(session, rule_id)
    if rule is None:
        return False
    await session.delete(rule)
    await session.flush()
    logger.info("Deleted rule #%d", rule_id)
    return True
