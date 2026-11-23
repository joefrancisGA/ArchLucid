"""FND-016 independently signed recovery rehearsal attestation.

Uses pinned Ed25519 public key and canonical JSON, never trusts a caller-set
'verified' boolean. Signing is performed by a separate recovery authority.
"""
from __future__ import annotations
import base64
from datetime import datetime, timezone
import json
from typing import Mapping

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from scripts.integration.fnd016_recovery_stop_gate import RecoveryAttestation

DOMAIN = "archlucid.fnd016.recovery-rehearsal.v1"
FIELDS = {"domain", "tenantId", "projectId", "proposalId",
          "originalDigest", "rollbackDigest", "rehearsalPassed",
          "issuedAt", "keyId"}


def canonical(payload: Mapping[str, object]) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False).encode("utf-8")


def verify_recovery_attestation(
    document: Mapping[str, object],
    pinned_key: Ed25519PublicKey,
    expected_key_id: str,
) -> RecoveryAttestation:
    payload = document["payload"]
    if not isinstance(payload, dict) or set(payload) != FIELDS:
        raise ValueError("Invalid recovery attestation fields")
    if payload["domain"] != DOMAIN or payload["keyId"] != expected_key_id:
        raise ValueError("Untrusted recovery signing domain or key")
    if payload["rehearsalPassed"] is not True:
        raise ValueError("Recovery rehearsal failed")
    for name in ("tenantId", "projectId", "proposalId", "originalDigest",
                 "rollbackDigest", "issuedAt", "keyId"):
        if not isinstance(payload[name], str) or not payload[name]:
            raise ValueError("Missing recovery attestation binding")
    issued = datetime.fromisoformat(payload["issuedAt"].replace("Z", "+00:00"))
    if issued.tzinfo is None:
        raise ValueError("Recovery timestamp must include timezone")
    signature = base64.b64decode(document["signature"], validate=True)
    pinned_key.verify(signature, canonical(payload))
    return RecoveryAttestation(
        tenant_id=payload["tenantId"], project_id=payload["projectId"],
        proposal_id=payload["proposalId"],
        original_digest=payload["originalDigest"],
        rollback_digest=payload["rollbackDigest"],
        rehearsal_passed=True, signed_by_independent_authority=True,
        issued_at=issued,
    )
