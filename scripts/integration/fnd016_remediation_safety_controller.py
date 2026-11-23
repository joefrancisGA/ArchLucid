"""FND-016: fail-closed, non-executing remediation safety controller.

This policy gate never touches cloud resources or authorizes execution. It
requires independently sourced, current facts and FND-014/015 planning evidence.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Mapping, Sequence

from scripts.integration.fnd014_isolated_dry_run import DryRunResult, RemediationStep
from scripts.integration.fnd015_rollback_planner import RollbackPlanResult


@dataclass(frozen=True)
class SafetyPolicy:
    max_changed_resources: int = 3
    max_steps: int = 10
    permitted_operations: tuple[str, ...] = ("set-property", "remove-property")
    forbidden_criticalities: tuple[str, ...] = ("critical", "unknown")


@dataclass(frozen=True)
class SafetyFacts:
    tenant_id: str
    project_id: str
    proposal_id: str
    current_model_digest: str
    resource_criticality: Mapping[str, str]
    dependents: Mapping[str, tuple[str, ...]]
    approved_dependencies: frozenset[str]
    emergency_stop_active: bool
    facts_verified: bool


@dataclass(frozen=True)
class SafetyDecision:
    status: str
    reasons: tuple[str, ...]
    eligible_for_execution: bool = False


def assess_remediation_safety(
    *, tenant_id: str, project_id: str, proposal_id: str,
    steps: Sequence[RemediationStep],
    dry_run: DryRunResult,
    rollback: RollbackPlanResult,
    facts: SafetyFacts,
    policy: SafetyPolicy = SafetyPolicy(),
) -> SafetyDecision:
    def reject(reason: str) -> SafetyDecision:
        return SafetyDecision("rejected", (reason,))
    if not all((tenant_id, project_id, proposal_id)):
        return reject("missing_scope")
    # These values are supplied by an integration adapter, not guaranteed typed
    # at runtime: never treat strings or integers as verification evidence.
    if (facts.facts_verified is not True or facts.tenant_id != tenant_id
            or facts.project_id != project_id or facts.proposal_id != proposal_id):
        return reject("untrusted_or_foreign_facts")
    # Only a literally cleared Boolean stop state is safe to review.
    if facts.emergency_stop_active is not False:
        return reject("emergency_stop" if facts.emergency_stop_active is True
                      else "emergency_stop_unverified")
    if (not steps or len(steps) > policy.max_steps or
            policy.max_steps < 1 or policy.max_changed_resources < 1):
        return reject("step_limit")
    if any(s.operation not in policy.permitted_operations for s in steps):
        return reject("unsupported_operation")
    resources = {s.resource_id for s in steps}
    if len(resources) > policy.max_changed_resources:
        return reject("blast_radius_exceeded")
    if not resources or any(not r or r not in facts.resource_criticality for r in resources):
        return reject("missing_resource_classification")
    if any(facts.resource_criticality[r] in policy.forbidden_criticalities
           or facts.resource_criticality[r] not in ("low", "medium", "high", "critical")
           for r in resources):
        return reject("critical_or_unknown_resource")
    if any(r not in facts.dependents for r in resources):
        return reject("missing_dependency_inventory")
    affected = {d for r in resources for d in facts.dependents[r]}
    if not affected.issubset(facts.approved_dependencies):
        return reject("unapproved_dependency_impact")
    if (dry_run.status != "simulated" or dry_run.reasons
            or not dry_run.decision_id or not dry_run.simulated_digest
            or facts.current_model_digest != dry_run.original_digest):
        return reject("stale_or_unverified_dry_run")
    if rollback.status != "planned" or rollback.reasons or not rollback.document:
        return reject("rollback_not_planned")
    if len(rollback.inverse_steps) != len(dry_run.changes):
        return reject("rollback_incomplete")
    if rollback.document.get("tenantId") != tenant_id or rollback.document.get("proposalRef") != proposal_id:
        return reject("rollback_scope_mismatch")
    # A manual rollback plan is not validated recovery readiness.
    # Never return execution eligibility without independent recovery proof.
    return SafetyDecision("review_required", ("independent_recovery_validation_required",))
