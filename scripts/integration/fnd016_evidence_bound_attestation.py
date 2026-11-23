"""FND-016 independently issued, ordered-input-bound recovery attestation v3.

The rehearsal process cannot sign. A separate authority must inspect the
rehearsal evidence and sign its canonical digest with an external key.
"""
from __future__ import annotations
import base64
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
import hashlib
import json
from typing import Callable, Mapping, Sequence

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from scripts.integration.fnd016_signed_recovery_attestation import canonical
from scripts.integration.fnd014_isolated_dry_run import RemediationStep
from scripts.integration.fnd016_isolated_recovery_rehearsal import remediation_steps_sha256
from scripts.integration.fnd016_recovery_stop_gate import RecoveryAttestation

# v3 is deliberately domain-separated: the old v2 record did not bind
# the exact forward/rollback steps and must not silently gain that claim.
DOMAIN = "archlucid.fnd016.recovery-rehearsal.v3"
REQUIRED = {"domain", "tenantId", "projectId", "proposalId", "originalDigest",
            "rollbackDigest", "rehearsalEvidenceSha256", "rehearsalPassed",
            "isolation", "issuedAt", "keyId",
            "forwardStepsSha256", "inverseStepsSha256"}
EVIDENCE_FIELDS = {"schemaVersion", "tenantId", "projectId", "proposalId",
                   "originalDigest", "simulatedDigest", "rollbackDigest",
                   "forwardDecisionId", "reverseDecisionId",
                   "rehearsalPassed", "isolation",
                   "forwardStepsSha256", "inverseStepsSha256"}


def evidence_digest(evidence: Mapping[str, object]) -> str:
    if not isinstance(evidence, dict) or set(evidence) != EVIDENCE_FIELDS:
        raise ValueError("Invalid rehearsal evidence")
    if (evidence["schemaVersion"] != "1.1.0"
            or evidence["rehearsalPassed"] is not True
            or evidence["isolation"] != "in-memory-only"):
        raise ValueError("Unsuccessful or unrecognized rehearsal")
    for field in EVIDENCE_FIELDS - {"rehearsalPassed"}:
        if not isinstance(evidence[field], str) or not evidence[field]:
            raise ValueError("Invalid rehearsal evidence field")
    for field in ("originalDigest", "simulatedDigest", "rollbackDigest",
                  "forwardStepsSha256", "inverseStepsSha256"):
        value = evidence[field]
        if (len(value) != 64
                or any(character not in "0123456789abcdef" for character in value)):
            raise ValueError("Invalid SHA-256 evidence binding")
    if evidence["originalDigest"] != evidence["rollbackDigest"]:
        raise ValueError("Recovery did not restore original state")
    return hashlib.sha256(canonical(evidence)).hexdigest()


def prepare_attestation(evidence: Mapping[str, object], *, key_id: str,
                        issued_at: datetime) -> dict[str, object]:
    digest = evidence_digest(evidence)
    if not key_id or issued_at.tzinfo is None or issued_at.utcoffset() is None:
        raise ValueError("Missing signing authority or UTC timestamp")
    return {
        "domain": DOMAIN, "tenantId": evidence["tenantId"],
        "projectId": evidence["projectId"], "proposalId": evidence["proposalId"],
        "originalDigest": evidence["originalDigest"],
        "rollbackDigest": evidence["rollbackDigest"],
        "rehearsalEvidenceSha256": digest, "rehearsalPassed": True,
        "forwardStepsSha256": evidence["forwardStepsSha256"],
        "inverseStepsSha256": evidence["inverseStepsSha256"],
        "isolation": "in-memory-only", "issuedAt": issued_at.isoformat(),
        "keyId": key_id,
    }


def _validate_payload_binding(
    payload: Mapping[str, object], evidence: Mapping[str, object],
    expected_forward_steps: Sequence[RemediationStep],
    expected_inverse_steps: Sequence[RemediationStep],
) -> datetime:
    """Shared evidence/plan validation used before signing and on verification.

    Expected steps must come from a separately authenticated, immutable plan;
    comparing caller-supplied copies is not an independent provenance proof.
    """
    if not isinstance(payload, dict) or set(payload) != REQUIRED or payload["domain"] != DOMAIN:
        raise ValueError("Unsupported attestation")
    if payload["rehearsalPassed"] is not True or payload["isolation"] != "in-memory-only":
        raise ValueError("Invalid rehearsal claim")
    digest = evidence_digest(evidence)
    if (evidence["forwardStepsSha256"] != remediation_steps_sha256(expected_forward_steps)
            or evidence["inverseStepsSha256"] != remediation_steps_sha256(expected_inverse_steps)):
        raise ValueError("Rehearsal inputs do not match independently expected steps")
    if payload["rehearsalEvidenceSha256"] != digest:
        raise ValueError("Rehearsal evidence digest mismatch")
    for field in ("tenantId", "projectId", "proposalId", "originalDigest",
                  "rollbackDigest", "forwardStepsSha256", "inverseStepsSha256"):
        if payload[field] != evidence[field]:
            raise ValueError("Rehearsal scope or state mismatch")
    key_id = payload["keyId"]
    if not isinstance(key_id, str) or not key_id.strip():
        raise ValueError("Missing signing key identifier")
    raw_time = payload["issuedAt"]
    if not isinstance(raw_time, str):
        raise ValueError("Invalid attestation timestamp")
    try:
        issued = datetime.fromisoformat(raw_time.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("Invalid attestation timestamp") from exc
    if issued.tzinfo is None or issued.utcoffset() is None:
        raise ValueError("Unsigned or naive timestamp")
    return issued


@dataclass(frozen=True)
class ReviewedPlanSnapshot:
    """Reference DTO returned by a separate authoritative, scoped plan reader.

    This frozen Python object is not immutable persistence or an approval
    credential. The reader must enforce authorization, current revision and
    independent integrity of the stored plan in a real integration.
    """
    tenant_id: str
    project_id: str
    proposal_id: str
    revision: int
    approved: bool
    approved_at: datetime
    expires_at: datetime
    forward_steps: tuple[RemediationStep, ...]
    inverse_steps: tuple[RemediationStep, ...]
    content_sha256: str


def reviewed_plan_content_sha256(plan: ReviewedPlanSnapshot) -> str:
    """Canonical checksum of the scope, approval interval, revision and steps."""
    if (not isinstance(plan.revision, int) or isinstance(plan.revision, bool)
            or plan.revision < 1):
        raise ValueError("Invalid reviewed plan revision")
    for name in ("tenant_id", "project_id", "proposal_id"):
        value = getattr(plan, name)
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Invalid reviewed plan scope")
    for value in (plan.approved_at, plan.expires_at):
        if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Invalid reviewed plan timestamp")
    record = {
        "tenantId": plan.tenant_id, "projectId": plan.project_id,
        "proposalId": plan.proposal_id, "revision": plan.revision,
        "approved": plan.approved is True,
        "approvedAt": plan.approved_at.isoformat(),
        "expiresAt": plan.expires_at.isoformat(),
        "forwardStepsSha256": remediation_steps_sha256(plan.forward_steps),
        "inverseStepsSha256": remediation_steps_sha256(plan.inverse_steps),
    }
    return hashlib.sha256(canonical(record)).hexdigest()


def _read_current_reviewed_plan(
    *, tenant_id: str, project_id: str, proposal_id: str,
    min_revision: int, now: datetime,
    read_current_plan: Callable[[str, str, str], ReviewedPlanSnapshot | None],
) -> ReviewedPlanSnapshot:
    """Resolve from the configured authority, never from the signing payload."""
    if (not all(isinstance(value, str) and value.strip()
                for value in (tenant_id, project_id, proposal_id))
            or not isinstance(min_revision, int) or isinstance(min_revision, bool)
            or min_revision < 1 or not isinstance(now, datetime)
            or now.tzinfo is None or now.utcoffset() is None):
        raise ValueError("Missing trusted plan lookup context")
    # A missing, failing or unconfigured reader must not fall back to
    # caller-provided expected steps or signed evidence.
    if not callable(read_current_plan):
        raise ValueError("Trusted plan reader unavailable")
    plan = read_current_plan(tenant_id, project_id, proposal_id)
    if not isinstance(plan, ReviewedPlanSnapshot):
        raise ValueError("Authoritative reviewed plan unavailable")
    if (plan.tenant_id != tenant_id or plan.project_id != project_id
            or plan.proposal_id != proposal_id):
        raise ValueError("Reviewed plan scope mismatch")
    if plan.revision < min_revision:
        raise ValueError("Reviewed plan revision stale")
    if plan.approved is not True:
        raise ValueError("Reviewed plan not approved")
    if (plan.approved_at > now or now >= plan.expires_at
            or plan.approved_at >= plan.expires_at):
        raise ValueError("Reviewed plan expired or not yet approved")
    expected_hash = reviewed_plan_content_sha256(plan)
    if (not isinstance(plan.content_sha256, str)
            or plan.content_sha256 != expected_hash):
        raise ValueError("Reviewed plan content integrity mismatch")
    return plan


def issue_with_external_signer(
    payload: dict[str, object], signer: Callable[[bytes], bytes], *,
    evidence: Mapping[str, object],
    expected_forward_steps: Sequence[RemediationStep],
    expected_inverse_steps: Sequence[RemediationStep],
) -> dict[str, object]:
    # Fail closed before crossing the external signing boundary. A correct
    # shape/domain alone is not proof of reviewed rehearsal or plan inputs.
    _validate_payload_binding(
        payload, evidence, expected_forward_steps, expected_inverse_steps)
    signature = signer(canonical(payload))
    if not isinstance(signature, bytes) or len(signature) != 64:
        raise ValueError("External signer returned invalid Ed25519 signature")
    return {"payload": payload, "signature": base64.b64encode(signature).decode("ascii")}


def issue_from_authoritative_plan(
    payload: dict[str, object], signer: Callable[[bytes], bytes], *,
    evidence: Mapping[str, object],
    tenant_id: str, project_id: str, proposal_id: str,
    min_revision: int, now: datetime,
    read_current_plan: Callable[[str, str, str], ReviewedPlanSnapshot | None],
) -> dict[str, object]:
    """Reference signing adapter: fetch current reviewed steps independently.

    Caller must supply an authenticated trusted scope and a separately
    configured plan reader. Neither the evidence nor payload supplies steps.
    """
    plan = _read_current_reviewed_plan(
        tenant_id=tenant_id, project_id=project_id, proposal_id=proposal_id,
        min_revision=min_revision, now=now, read_current_plan=read_current_plan)
    issued = _validate_payload_binding(
        payload, evidence, plan.forward_steps, plan.inverse_steps)
    if (payload["tenantId"] != tenant_id or payload["projectId"] != project_id
            or payload["proposalId"] != proposal_id):
        raise ValueError("Signing request scope differs from trusted scope")
    if (issued < plan.approved_at or issued >= plan.expires_at
            or not timedelta(0) <= now - issued <= timedelta(minutes=5)):
        raise ValueError("Signing request outside reviewed plan freshness window")
    return issue_with_external_signer(
        payload, signer, evidence=evidence,
        expected_forward_steps=plan.forward_steps,
        expected_inverse_steps=plan.inverse_steps)


def verify_against_authoritative_plan(
    document: Mapping[str, object], evidence: Mapping[str, object],
    pinned_key: Ed25519PublicKey, expected_key_id: str, *,
    tenant_id: str, project_id: str, proposal_id: str,
    min_revision: int, now: datetime,
    read_current_plan: Callable[[str, str, str], ReviewedPlanSnapshot | None],
) -> RecoveryAttestation:
    """Verify v3 signature only against separately reread current plan."""
    plan = _read_current_reviewed_plan(
        tenant_id=tenant_id, project_id=project_id, proposal_id=proposal_id,
        min_revision=min_revision, now=now, read_current_plan=read_current_plan)
    attestation = verify_evidence_bound_attestation(
        document, evidence, pinned_key, expected_key_id,
        expected_forward_steps=plan.forward_steps,
        expected_inverse_steps=plan.inverse_steps)
    if (attestation.tenant_id != tenant_id or
            attestation.project_id != project_id or
            attestation.proposal_id != proposal_id or
            attestation.issued_at < plan.approved_at or
            attestation.issued_at >= plan.expires_at or
            not timedelta(0) <= now - attestation.issued_at <= timedelta(minutes=5)):
        raise ValueError("Attestation scope or reviewed plan freshness mismatch")
    return attestation


def verify_evidence_bound_attestation(
    document: Mapping[str, object], evidence: Mapping[str, object],
    pinned_key: Ed25519PublicKey, expected_key_id: str, *,
    expected_forward_steps: Sequence[RemediationStep],
    expected_inverse_steps: Sequence[RemediationStep],
) -> RecoveryAttestation:
    if set(document) != {"payload", "signature"}:
        raise ValueError("Unexpected signed envelope")
    payload = document["payload"]
    if not isinstance(payload, dict) or set(payload) != REQUIRED:
        raise ValueError("Unexpected attestation fields")
    if payload["domain"] != DOMAIN or payload["keyId"] != expected_key_id:
        raise ValueError("Untrusted attestation key or domain")
    issued = _validate_payload_binding(
        payload, evidence, expected_forward_steps, expected_inverse_steps)
    signature = base64.b64decode(document["signature"], validate=True)
    pinned_key.verify(signature, canonical(payload))
    return RecoveryAttestation(
        tenant_id=payload["tenantId"], project_id=payload["projectId"],
        proposal_id=payload["proposalId"], original_digest=payload["originalDigest"],
        rollback_digest=payload["rollbackDigest"], rehearsal_passed=True,
        signed_by_independent_authority=True, issued_at=issued,
    )
