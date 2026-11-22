"""FND-005 adapter: verify schema-shaped evidence against trusted scope and keyring.

Pure, read-only adapter. Caller must authorize the evidence dereference before
passing bytes and a record here. Never accept a key supplied by the evidence record.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Mapping
from uuid import UUID

from scripts.integration.fnd005_evidence_verifier import (
    EvidenceClaim, VerificationResult, verify_evidence,
)


@dataclass(frozen=True)
class TrustedProducer:
    key_id: str
    secret: bytes
    active_from: datetime
    active_until: datetime


def _timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp must include timezone")
    return parsed.astimezone(timezone.utc)


def _uuid(value: object) -> str:
    return str(UUID(str(value)))


def verify_canonical_record(
    record: Mapping[str, object],
    content: bytes,
    *,
    expected_tenant_id: str,
    expected_lineage: Mapping[str, str],
    keyring: Mapping[str, TrustedProducer],
    signature: str | None,
    key_id: str | None,
    verified_at: datetime,
) -> VerificationResult:
    """Only trusted caller-provided keyring entries may authenticate producers.

    Signature and key_id are transport metadata supplied through a trusted
    channel, not fields in the existing canonical evidence schema.
    """
    evidence_id = str(record.get("evidenceId", ""))
    try:
        if record.get("schemaVersion") != "1.0.0":
            raise ValueError("unsupported_schema")
        if record.get("provenanceKind") not in (
            "ObservedFact", "DerivedFact", "DeterministicInference", "AiInference", "HumanAssertion"
        ):
            raise ValueError("invalid_provenance_kind")
        source = record["source"]
        if not isinstance(source, dict) or any(
            not isinstance(source.get(field), str) or not source[field].strip()
            for field in ("system", "reference", "collectorVersion")
        ):
            raise ValueError("invalid_source")
        captured = _timestamp(str(record["capturedAt"]))
        at = verified_at.astimezone(timezone.utc)
        if captured > at:
            raise ValueError("future_capture")
        if record.get("verificationStatus") == "rejected":
            raise ValueError("upstream_rejected")
        integrity = record["integrity"]
        if not isinstance(integrity, dict) or integrity.get("algorithm") != "sha256":
            raise ValueError("unsupported_digest")
        claim = EvidenceClaim(
            tenant_id=_uuid(record["tenantId"]),
            workspace_id=_uuid(expected_lineage["workspace_id"]),
            project_id=_uuid(expected_lineage["project_id"]),
            run_id=_uuid(expected_lineage["run_id"]),
            snapshot_id=_uuid(expected_lineage["snapshot_id"]),
            evidence_id=_uuid(evidence_id),
            sha256=str(integrity["digest"]),
            signature=signature,
        )
        scope = {
            "tenant_id": _uuid(expected_tenant_id),
            **{field: _uuid(expected_lineage[field]) for field in
               ("workspace_id", "project_id", "run_id", "snapshot_id")},
        }
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        return VerificationResult("rejected", (str(exc),), evidence_id)

    # The canonical record only binds tenant ID. Workspace/project/run/snapshot
    # must be authenticated through a separately trusted lookup of evidence ID.
    # Never derive these from untrusted caller assertions alone.
    bound = expected_lineage.get("evidence_id")
    if bound is None or bound != claim.evidence_id:
        return VerificationResult("rejected", ("lineage_binding_missing",), evidence_id)

    if not key_id or not signature:
        return verify_evidence(content, claim, scope)
    producer = keyring.get(key_id)
    if producer is None or producer.key_id != key_id:
        return VerificationResult("rejected", ("untrusted_producer_key",), evidence_id)
    if verified_at.tzinfo is None or not (producer.active_from <= at < producer.active_until):
        return VerificationResult("rejected", ("producer_key_inactive",), evidence_id)
    return verify_evidence(content, claim, scope, trusted_hmac_key=producer.secret)
