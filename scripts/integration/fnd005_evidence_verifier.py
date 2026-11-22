"""FND-005: inert, standard-library evidence integrity and tenant-lineage verifier.

SHA-256 establishes byte integrity only. HMAC additionally authenticates a trusted
producer holding the verification key; it is not a replacement for tenant authorization.
No network access, mutation, remediation, or secret logging.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import hmac
import json
from typing import Mapping


@dataclass(frozen=True)
class EvidenceClaim:
    tenant_id: str
    workspace_id: str
    project_id: str
    run_id: str
    snapshot_id: str
    evidence_id: str
    sha256: str
    signature: str | None = None


@dataclass(frozen=True)
class VerificationResult:
    status: str
    reasons: tuple[str, ...]
    evidence_id: str


def canonical_claim(claim: EvidenceClaim) -> bytes:
    fields = {
        "evidenceId": claim.evidence_id,
        "projectId": claim.project_id,
        "runId": claim.run_id,
        "sha256": claim.sha256,
        "snapshotId": claim.snapshot_id,
        "tenantId": claim.tenant_id,
        "workspaceId": claim.workspace_id,
    }
    return json.dumps(fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sign_claim(claim: EvidenceClaim, key: bytes) -> str:
    if len(key) < 32:
        raise ValueError("HMAC key must contain at least 32 bytes")
    return hmac.new(key, canonical_claim(claim), hashlib.sha256).hexdigest()


def verify_evidence(
    content: bytes,
    claim: EvidenceClaim,
    expected_scope: Mapping[str, str],
    *,
    trusted_hmac_key: bytes | None = None,
) -> VerificationResult:
    """Fail closed on scope/lineage, byte integrity and producer authenticity.

    A claim without a trusted HMAC is classified as unverified, never verified.
    """
    reasons: list[str] = []
    scope_fields = ("tenant_id", "workspace_id", "project_id", "run_id", "snapshot_id")
    for field in scope_fields:
        expected = expected_scope.get(field)
        actual = getattr(claim, field)
        if not isinstance(expected, str) or not expected.strip() or not actual or not hmac.compare_digest(expected, actual):
            reasons.append(f"{field}_mismatch")
    if not claim.evidence_id.strip():
        reasons.append("missing_evidence_id")
    digest = hashlib.sha256(content).hexdigest()
    if len(claim.sha256) != 64 or not hmac.compare_digest(digest, claim.sha256.lower()):
        reasons.append("digest_mismatch")
    if reasons:
        return VerificationResult("rejected", tuple(reasons), claim.evidence_id)
    if trusted_hmac_key is None or claim.signature is None:
        return VerificationResult("unverified", ("producer_authentication_missing",), claim.evidence_id)
    if len(trusted_hmac_key) < 32:
        return VerificationResult("rejected", ("invalid_verification_key",), claim.evidence_id)
    signature = sign_claim(claim, trusted_hmac_key)
    if not hmac.compare_digest(signature, claim.signature.lower()):
        return VerificationResult("rejected", ("invalid_producer_signature",), claim.evidence_id)
    return VerificationResult("verified", (), claim.evidence_id)
