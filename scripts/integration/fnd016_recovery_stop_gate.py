"""FND-016 recovery attestation and durable-stop decision contract.

This module never executes remediation or changes emergency-stop state.
Callers must supply authenticated fresh facts from independent authorities.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from scripts.integration.fnd016_remediation_safety_controller import SafetyDecision


@dataclass(frozen=True)
class StopSnapshot:
    tenant_id: str
    project_id: str
    active: bool
    generation: int
    observed_at: datetime
    authority_verified: bool


@dataclass(frozen=True)
class RecoveryAttestation:
    tenant_id: str
    project_id: str
    proposal_id: str
    original_digest: str
    rollback_digest: str
    rehearsal_passed: bool
    signed_by_independent_authority: bool
    issued_at: datetime


@dataclass(frozen=True)
class RecoveryGateResult:
    status: str
    reasons: tuple[str, ...]
    eligible_for_execution: bool = False


def assess_recovery_and_stop(
    preliminary: SafetyDecision,
    stop: StopSnapshot | None,
    attestation: RecoveryAttestation | None,
    *,
    tenant_id: str, project_id: str, proposal_id: str,
    original_digest: str, rollback_digest: str,
    now: datetime,
    max_age: timedelta = timedelta(minutes=5),
) -> RecoveryGateResult:
    def deny(reason: str) -> RecoveryGateResult:
        return RecoveryGateResult("rejected", (reason,))
    if preliminary.status != "review_required" or preliminary.eligible_for_execution:
        return deny("preliminary_safety_not_verified")
    if now.tzinfo is None or now.utcoffset() is None:
        return deny("untrusted_clock")
    if (stop is None or not stop.authority_verified or stop.generation < 1
            or stop.tenant_id != tenant_id or stop.project_id != project_id):
        return deny("stop_state_unavailable")
    if stop.active:
        return deny("emergency_stop")
    if (stop.observed_at.tzinfo is None or
            not timedelta(0) <= now - stop.observed_at <= max_age):
        return deny("stop_state_stale")
    if (attestation is None or not attestation.signed_by_independent_authority
            or not attestation.rehearsal_passed):
        return deny("recovery_not_independently_verified")
    if (attestation.tenant_id != tenant_id or attestation.project_id != project_id
            or attestation.proposal_id != proposal_id
            or attestation.original_digest != original_digest
            or attestation.rollback_digest != rollback_digest):
        return deny("recovery_binding_mismatch")
    if (attestation.issued_at.tzinfo is None or
            not timedelta(0) <= now - attestation.issued_at <= max_age):
        return deny("recovery_attestation_stale")
    # No live execution permission exists. The real execution gate must
    # independently re-read stop state, check generation, and reauthorize.
    return RecoveryGateResult("review_required", ("execution_gate_not_connected",))
