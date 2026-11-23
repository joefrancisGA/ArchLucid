"""FND-016 independently issued, ordered-input-bound recovery attestation v3.

The rehearsal process cannot sign. A separate authority must inspect the
rehearsal evidence and sign its canonical digest with an external key.
"""
from __future__ import annotations
import base64
from datetime import datetime, timezone
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
