"""FND-010 reference authorization gate for FND-005 evidence retrieval.

No evidence bytes are fetched until a trusted decision service explicitly allows
the exact principal, action, scope and evidence identifier. Not production wired.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Mapping, Protocol

from scripts.integration.fnd005_canonical_adapter import TrustedProducer
from scripts.integration.fnd005_evidence_verifier import VerificationResult
from scripts.integration.fnd005_signed_envelope import (
    ReplayStore, SignedEvidenceEnvelope, verify_signed_envelope,
)


@dataclass(frozen=True)
class EvidenceAccessRequest:
    principal_id: str
    tenant_id: str
    workspace_id: str
    project_id: str
    run_id: str
    snapshot_id: str
    evidence_id: str
    action: str = "evidence.read"


@dataclass(frozen=True)
class AuthorizationDecision:
    allowed: bool
    principal_id: str
    action: str
    tenant_id: str
    evidence_id: str
    decision_id: str


class DecisionService(Protocol):
    def decide(self, request: EvidenceAccessRequest) -> AuthorizationDecision:
        """Evaluate trusted principal, entitlement, action and resource binding."""
        ...


class ScopedEvidenceRepository(Protocol):
    def load_authorized(self, request: EvidenceAccessRequest) -> tuple[SignedEvidenceEnvelope, bytes]:
        """Load evidence under the same enforced tenant and resource scope.

        Must independently enforce scope in the underlying storage query.
        """
        ...


@dataclass(frozen=True)
class AccessOutcome:
    status: str
    reason: str
    decision_id: str | None = None
    verification: VerificationResult | None = None


def retrieve_and_verify(
    request: EvidenceAccessRequest,
    *,
    decisions: DecisionService,
    repository: ScopedEvidenceRepository,
    keyring: Mapping[str, TrustedProducer],
    replay_store: ReplayStore,
    now: datetime,
) -> AccessOutcome:
    """Fail closed; do not leak cross-tenant existence or fetch on denial."""
    fields = (
        request.principal_id, request.tenant_id, request.workspace_id,
        request.project_id, request.run_id, request.snapshot_id, request.evidence_id,
    )
    if any(not isinstance(value, str) or not value.strip() for value in fields):
        return AccessOutcome("denied", "invalid_request")
    if request.action != "evidence.read":
        return AccessOutcome("denied", "unsupported_action")
    try:
        decision = decisions.decide(request)
        if (
            not decision.allowed or not decision.decision_id
            or decision.principal_id != request.principal_id
            or decision.action != request.action
            or decision.tenant_id != request.tenant_id
            or decision.evidence_id != request.evidence_id
        ):
            return AccessOutcome("denied", "not_authorized")
    except Exception:
        return AccessOutcome("denied", "authorization_unavailable")

    try:
        envelope, content = repository.load_authorized(request)
        expected_lineage = {
            "workspace_id": request.workspace_id,
            "project_id": request.project_id,
            "run_id": request.run_id,
            "snapshot_id": request.snapshot_id,
            "evidence_id": request.evidence_id,
        }
        if envelope.record.get("evidenceId") != request.evidence_id:
            return AccessOutcome("rejected", "resource_binding_mismatch", decision.decision_id)
        result = verify_signed_envelope(
            envelope, content,
            authorized_tenant_id=request.tenant_id,
            trusted_lineage=expected_lineage,
            keyring=keyring,
            replay_store=replay_store,
            now=now,
        )
        return AccessOutcome(
            "verified" if result.status == "verified" else "rejected",
            "verified" if result.status == "verified" else "evidence_verification_failed",
            decision.decision_id,
            result,
        )
    except Exception:
        return AccessOutcome("rejected", "evidence_unavailable", decision.decision_id)
