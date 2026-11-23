"""FND-016 isolated rollback rehearsal: deterministic in-memory simulation only.

No cloud SDK, shell, network, filesystem writes or production executor.
A separate signer must attest to the returned evidence after verification.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Mapping, Sequence

from scripts.integration.fnd014_isolated_dry_run import (
    DryRunAuthorization, DryRunResult, RemediationStep, simulate_remediation, _digest,
)
from scripts.integration.fnd015_rollback_planner import RollbackPlanResult


@dataclass(frozen=True)
class RecoveryRehearsalResult:
    status: str
    reasons: tuple[str, ...]
    original_digest: str | None
    rollback_digest: str | None
    simulated_digest: str | None
    evidence: dict[str, object] | None


def rehearse_recovery(
    source: Mapping[str, Mapping[str, str]],
    steps: Sequence[RemediationStep],
    *,
    tenant_id: str, project_id: str, proposal_id: str,
    dry_run: DryRunResult,
    rollback: RollbackPlanResult,
) -> RecoveryRehearsalResult:
    def reject(reason: str) -> RecoveryRehearsalResult:
        return RecoveryRehearsalResult("rejected", (reason,), None, None, None, None)
    if not all((tenant_id, project_id, proposal_id)):
        return reject("missing_scope")
    if dry_run.status != "simulated" or dry_run.reasons or not dry_run.simulated_digest:
        return reject("dry_run_not_verified")
    if rollback.status != "planned" or rollback.reasons or rollback.document is None:
        return reject("rollback_not_planned")
    if rollback.document.get("tenantId") != tenant_id or rollback.document.get("proposalRef") != proposal_id:
        return reject("rollback_scope_mismatch")
    if _digest(source) != dry_run.original_digest:
        return reject("source_state_changed")
    forward = simulate_remediation(
        source, steps, principal_id="isolated-rehearsal", tenant_id=tenant_id,
        project_id=project_id, proposal_id=proposal_id,
        decision=DryRunAuthorization("isolated-rehearsal", tenant_id, project_id,
            proposal_id, "remediation.simulate", True, "rehearsal-forward"))
    if forward.status != "simulated" or forward.simulated_digest != dry_run.simulated_digest:
        return reject("forward_replay_mismatch")
    if forward.changes != dry_run.changes:
        return reject("forward_changes_mismatch")
    if len(rollback.inverse_steps) != len(dry_run.changes):
        return reject("inverse_steps_incomplete")
    # Materialize only a private in-memory copy of the forward state.
    working = {resource: dict(props) for resource, props in source.items()}
    for resource, key, old, new in forward.changes:
        if old is None and key in working[resource]:
            return reject("forward_precondition_mismatch")
        if old is not None and working[resource].get(key) != old:
            return reject("forward_precondition_mismatch")
        if new is None:
            working[resource].pop(key, None)
        else:
            working[resource][key] = new
    if _digest(working) != dry_run.simulated_digest:
        return reject("forward_digest_mismatch")
    reverse = simulate_remediation(
        working, rollback.inverse_steps, principal_id="isolated-rehearsal",
        tenant_id=tenant_id, project_id=project_id, proposal_id=proposal_id,
        decision=DryRunAuthorization("isolated-rehearsal", tenant_id, project_id,
            proposal_id, "remediation.simulate", True, "rehearsal-reverse"))
    if reverse.status != "simulated" or reverse.simulated_digest != dry_run.original_digest:
        return reject("rollback_replay_mismatch")
    return RecoveryRehearsalResult(
        "passed", (), dry_run.original_digest, reverse.simulated_digest,
        forward.simulated_digest,
        {"schemaVersion": "1.0.0", "tenantId": tenant_id, "projectId": project_id,
         "proposalId": proposal_id, "originalDigest": dry_run.original_digest,
         "simulatedDigest": dry_run.simulated_digest,
         "rollbackDigest": reverse.simulated_digest,
         "forwardDecisionId": forward.decision_id,
         "reverseDecisionId": reverse.decision_id,
         "rehearsalPassed": True, "isolation": "in-memory-only"})
