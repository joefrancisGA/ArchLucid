"""FND-015: read-only rollout and rollback planning from FND-014 dry-run evidence.

Produces a proposed schema-shaped plan. Never applies, restores or executes changes.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Sequence

from scripts.integration.fnd014_isolated_dry_run import DryRunResult, RemediationStep


@dataclass(frozen=True)
class RollbackPlanningDecision:
    allowed: bool
    action: str
    tenant_id: str
    proposal_id: str
    decision_id: str


@dataclass(frozen=True)
class RollbackPlanResult:
    status: str
    reasons: tuple[str, ...]
    document: Mapping[str, object] | None
    inverse_steps: tuple[RemediationStep, ...]


def plan_rollout_and_rollback(
    dry_run: DryRunResult,
    *,
    tenant_id: str,
    proposal_id: str,
    evidence_refs: Sequence[str],
    deployment_policy_ref: str,
    decision: RollbackPlanningDecision,
) -> RollbackPlanResult:
    def reject(reason: str) -> RollbackPlanResult:
        return RollbackPlanResult("rejected", (reason,), None, ())
    if not all((tenant_id, proposal_id, deployment_policy_ref)):
        return reject("missing_scope_or_policy")
    # Caller-provided authorization facts must never be accepted by truthiness.
    # These reference decisions are not a production identity or policy check.
    if (decision.allowed is not True or decision.action != "remediation.plan"
        or decision.tenant_id != tenant_id or decision.proposal_id != proposal_id
        or not decision.decision_id):
        return reject("not_authorized")
    if (dry_run.status != "simulated" or dry_run.reasons or not dry_run.decision_id
        or not dry_run.original_digest or not dry_run.simulated_digest):
        return reject("dry_run_not_verified")
    if not evidence_refs or any(not isinstance(ref, str) or not ref.strip() for ref in evidence_refs):
        return reject("missing_evidence")
    if not dry_run.changes:
        return reject("no_changes")
    # Consecutive changes to the same property must form a coherent forward
    # state chain. Reversing contradictory caller-supplied tuples would produce
    # an inverse plan that cannot be safely replayed even in a reference model.
    last_values: dict[tuple[str, str], str | None] = {}
    for change in dry_run.changes:
        if not isinstance(change, (tuple, list)) or len(change) != 4:
            return reject("invalid_change")
        resource, key, old, new = change
        if (not isinstance(resource, str) or not resource
                or not isinstance(key, str) or not key
                or (old is not None and not isinstance(old, str))
                or (new is not None and not isinstance(new, str))
                or old == new):
            return reject("invalid_change")
        binding = (resource, key)
        if binding in last_values and old != last_values[binding]:
            return reject("inconsistent_change_chain")
        last_values[binding] = new

    inverse: list[RemediationStep] = []
    for resource, key, old, new in reversed(dry_run.changes):
        if old is None:
            inverse.append(RemediationStep("remove-property", resource, key, new, None))
        else:
            inverse.append(RemediationStep("set-property", resource, key, new, old))
    document: dict[str, object] = {
        "schemaVersion": "1.0.0",
        "tenantId": tenant_id,
        "proposalRef": proposal_id,
        "evidenceRefs": list(evidence_refs),
        "rolloutStatus": "planned",
        "preflight": {
            "status": "pending",
            "checks": [
                "verify signed evidence and authorized scope",
                "confirm source model digest matches dry-run input",
                "approve deployment under independent policy",
            ],
        },
        "checkpoints": [{
            "checkpointId": "post-deployment-verification",
            "successCriteria": "independent verification confirms intended state",
        }],
        "deploymentPolicyRef": deployment_policy_ref,
        "rollback": {
            "strategy": "manual",
            "triggerConditions": ["failed independent verification", "unexpected exposure"],
            "evidenceRequirements": [
                f"source-sha256:{dry_run.original_digest}",
                f"simulated-sha256:{dry_run.simulated_digest}",
                f"simulation-decision:{dry_run.decision_id}",
                f"planning-decision:{decision.decision_id}",
            ],
        },
    }
    return RollbackPlanResult("planned", (), document, tuple(inverse))
