"""FND-018 fail-closed, non-executing failure containment reference model.

Pure deterministic policy and state transitions. No I/O, production wiring,
background retry loop, resource mutations, or cloud dependencies.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Dependency(Enum):
    AUTHORIZATION = "authorization"
    AUDIT = "audit"
    EVIDENCE_INTEGRITY = "evidence_integrity"
    AI_REASONING = "ai_reasoning"
    REMEDIATION_PLANNER = "remediation_planner"


class Health(Enum):
    HEALTHY = "healthy"
    FAILED = "failed"
    UNKNOWN = "unknown"


class Mode(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    ISOLATED = "isolated"
    RECOVERING = "recovering"


class Capability(Enum):
    VIEW_VERIFIED_EVIDENCE = "view_verified_evidence"
    NEW_AI_ANALYSIS = "new_ai_analysis"
    PLAN_REMEDIATION = "plan_remediation"
    EXECUTE_REMEDIATION = "execute_remediation"


CRITICAL = frozenset({
    Dependency.AUTHORIZATION, Dependency.AUDIT, Dependency.EVIDENCE_INTEGRITY
})
DEGRADABLE = frozenset({
    Dependency.AI_REASONING, Dependency.REMEDIATION_PLANNER
})


@dataclass(frozen=True)
class FailureFacts:
    status: dict[Dependency, Health]
    evidence_verified: bool
    authorization_verified: bool
    audit_writable: bool
    # Missing or unverified stop status must never be interpreted as a cleared stop.
    emergency_stop_active: bool | None = None


@dataclass(frozen=True)
class ContainmentDecision:
    mode: Mode
    allowed: frozenset[Capability]
    reasons: tuple[str, ...]
    eligible_for_execution: bool = False


def assess_containment(facts: FailureFacts) -> ContainmentDecision:
    if set(facts.status) != set(Dependency):
        return ContainmentDecision(Mode.ISOLATED, frozenset(), ("incomplete_dependency_inventory",))
    unavailable_critical = sorted(
        d.value for d in CRITICAL if facts.status[d] is not Health.HEALTHY)
    if unavailable_critical or facts.authorization_verified is not True or facts.audit_writable is not True:
        reasons = tuple("critical_unavailable:" + name for name in unavailable_critical)
        if facts.authorization_verified is not True:
            reasons += ("authorization_unverified",)
        if facts.audit_writable is not True:
            reasons += ("audit_unavailable",)
        return ContainmentDecision(Mode.ISOLATED, frozenset(), reasons)
    if facts.evidence_verified is not True:
        return ContainmentDecision(Mode.ISOLATED, frozenset(), ("evidence_unverified",))
    # Only an explicit, independently supplied Boolean False may clear the stop.
    # Ambiguous/missing values still permit verified evidence viewing, not planning.
    if facts.emergency_stop_active is not False:
        reason = ("emergency_stop_active" if facts.emergency_stop_active is True
                  else "emergency_stop_unverified")
        return ContainmentDecision(
            Mode.DEGRADED, frozenset({Capability.VIEW_VERIFIED_EVIDENCE}),
            (reason,))
    allowed = {Capability.VIEW_VERIFIED_EVIDENCE}
    reasons = []
    if facts.status[Dependency.AI_REASONING] is Health.HEALTHY:
        allowed.add(Capability.NEW_AI_ANALYSIS)
    else:
        reasons.append("ai_unavailable")
    if facts.status[Dependency.REMEDIATION_PLANNER] is Health.HEALTHY:
        allowed.add(Capability.PLAN_REMEDIATION)
    else:
        reasons.append("planner_unavailable")
    return ContainmentDecision(
        Mode.DEGRADED if reasons else Mode.HEALTHY, frozenset(allowed),
        tuple(reasons))


@dataclass(frozen=True)
class RecoveryState:
    mode: Mode
    healthy_observations: int = 0


def transition_recovery(
    previous: RecoveryState,
    decision: ContainmentDecision,
    *,
    independent_recovery_verified: bool,
    minimum_healthy_observations: int = 2,
) -> RecoveryState:
    if minimum_healthy_observations < 2:
        raise ValueError("Recovery must require at least two healthy observations")
    if decision.mode is Mode.ISOLATED:
        return RecoveryState(Mode.ISOLATED, 0)
    if decision.mode is Mode.DEGRADED:
        return RecoveryState(Mode.DEGRADED, 0)
    if previous.mode is Mode.HEALTHY:
        return RecoveryState(Mode.HEALTHY, minimum_healthy_observations)
    if independent_recovery_verified is not True:
        return RecoveryState(Mode.RECOVERING, 0)
    observations = min(previous.healthy_observations + 1, minimum_healthy_observations)
    return RecoveryState(
        Mode.HEALTHY if observations >= minimum_healthy_observations else Mode.RECOVERING,
        observations)
