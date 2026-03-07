"""
evaluator.py — Automation rule evaluation engine.

Given an incoming UnifiedEvent, evaluates all enabled rules that match
the event's sensor_id, and determines whether their conditions are met.
"""

import logging

from app.database.models import AutomationRule

logger = logging.getLogger("processing-service.evaluator")

# Mapping of operator strings to comparison functions
_OPERATORS = {
    "<":  lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
    "=":  lambda a, b: a == b,
    ">":  lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
}


def evaluate_rule(rule: AutomationRule, event: dict) -> bool:
    """
    Evaluate a single automation rule against a unified event.

    Checks:
      1. Does the rule's sensor_name match the event's sensor_id?
      2. Does the event contain a measurement with the rule's metric?
      3. Does the measurement value satisfy the operator + threshold?

    Args:
        rule:  An AutomationRule ORM object.
        event: A UnifiedEvent dict (deserialized from Kafka).

    Returns:
        True if the rule's condition is satisfied by the event.
    """
    # 1. Check sensor match (normalize spaces → underscores)
    rule_sensor = rule.sensor_name.replace(" ", "_")
    if rule_sensor != event.get("sensor_id"):
        return False

    # 2. Find the matching measurement
    measurements = event.get("measurements", [])
    for m in measurements:
        if m.get("metric") == rule.metric:
            # 3. Apply comparison
            value = m.get("value")
            op_fn = _OPERATORS.get(rule.operator)
            if op_fn is None:
                logger.warning("Unknown operator '%s' in rule #%d", rule.operator, rule.id)
                return False
            result = op_fn(value, rule.threshold)
            if result:
                logger.info(
                    "Rule #%d TRIGGERED: %s.%s=%s %s %s → %s %s",
                    rule.id, rule.sensor_name, rule.metric,
                    value, rule.operator, rule.threshold,
                    rule.actuator_name, rule.actuator_state,
                )
            return result

    # Measurement metric not found in this event
    return False
