"""FND-005 v2: signed complete canonical record with atomic replay reservation.

Reference-only implementation; the in-memory replay store is NOT multi-process durable.
Production must provide an atomic shared store with TTL and failure-closed semantics.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
from threading import Lock
from typing import Mapping, Protocol

from scripts.integration.fnd005_canonical_adapter import TrustedProducer
from scripts.integration.fnd005_evidence_verifier import VerificationResult


def canonical_payload(record: Mapping[str, object], *, tenant_id: str,
                      lineage: Mapping[str, str], key_id: str, nonce: str,
                      issued_at: datetime, expires_at: datetime) -> bytes:
    """Domain-separated deterministic UTF-8 JSON; no floats or NaN accepted."""
    if not nonce or not key_id:
        raise ValueError("nonce and key ID required")
    body = {
        "domain": "archlucid.fnd005.full-record.v2",
        "record": record,
        "tenantId": tenant_id,
        "lineage": dict(lineage),
        "keyId": key_id,
        "nonce": nonce,
        "issuedAt": issued_at.astimezone(timezone.utc).isoformat(),
        "expiresAt": expires_at.astimezone(timezone.utc).isoformat(),
    }
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
                      allow_nan=False).encode("utf-8")


def sign_full_record(record: Mapping[str, object], *, tenant_id: str,
                     lineage: Mapping[str, str], key_id: str, nonce: str,
                     issued_at: datetime, expires_at: datetime, key: bytes) -> str:
    if len(key) < 32:
        raise ValueError("key too short")
    payload = canonical_payload(record, tenant_id=tenant_id, lineage=lineage,
                                key_id=key_id, nonce=nonce, issued_at=issued_at,
                                expires_at=expires_at)
    return hmac.new(key, payload, hashlib.sha256).hexdigest()


class ReplayStore(Protocol):
    def reserve_once(self, identifier: str, expires_at: datetime, now: datetime) -> bool:
        """Atomically return false when identifier was already reserved; fail closed on errors."""
        ...


class InMemoryReplayStore:
    """Single-process test reference. Not suitable for distributed deployment."""

    def __init__(self) -> None:
        self._seen: dict[str, datetime] = {}
        self._lock = Lock()

    def reserve_once(self, identifier: str, expires_at: datetime, now: datetime) -> bool:
        with self._lock:
            self._seen = {k: v for k, v in self._seen.items() if v > now}
            if identifier in self._seen:
                return False
            self._seen[identifier] = expires_at
            return True


@dataclass(frozen=True)
class SignedEvidenceEnvelope:
    record: Mapping[str, object]
    tenant_id: str
    lineage: Mapping[str, str]
    key_id: str
    nonce: str
    issued_at: datetime
    expires_at: datetime
    signature: str


def verify_signed_envelope(
    envelope: SignedEvidenceEnvelope,
    content: bytes,
    *,
    authorized_tenant_id: str,
    trusted_lineage: Mapping[str, str],
    keyring: Mapping[str, TrustedProducer],
    replay_store: ReplayStore,
    now: datetime,
    max_lifetime: timedelta = timedelta(minutes=5),
) -> VerificationResult:
    evidence_id = str(envelope.record.get("evidenceId", ""))
    def reject(reason: str) -> VerificationResult:
        return VerificationResult("rejected", (reason,), evidence_id)
    try:
        if now.tzinfo is None or envelope.issued_at.tzinfo is None or envelope.expires_at.tzinfo is None:
            return reject("timezone_required")
        if envelope.tenant_id != authorized_tenant_id or envelope.lineage != trusted_lineage:
            return reject("scope_or_lineage_mismatch")
        if not envelope.nonce or len(envelope.nonce) < 16:
            return reject("invalid_nonce")
        if not envelope.issued_at <= now < envelope.expires_at:
            return reject("outside_validity_window")
        if envelope.expires_at - envelope.issued_at > max_lifetime:
            return reject("excessive_lifetime")
        producer = keyring.get(envelope.key_id)
        if producer is None or producer.key_id != envelope.key_id or len(producer.secret) < 32:
            return reject("untrusted_key")
        if not producer.active_from <= envelope.issued_at < producer.active_until or now >= producer.active_until:
            return reject("inactive_key")
        record = envelope.record
        if record.get("schemaVersion") != "1.0.0" or record.get("tenantId") != authorized_tenant_id:
            return reject("record_scope_or_version")
        integrity = record.get("integrity")
        if not isinstance(integrity, dict) or integrity.get("algorithm") != "sha256":
            return reject("unsupported_integrity")
        digest = hashlib.sha256(content).hexdigest()
        claimed = integrity.get("digest")
        if not isinstance(claimed, str) or not hmac.compare_digest(digest, claimed):
            return reject("digest_mismatch")
        expected = sign_full_record(record, tenant_id=envelope.tenant_id,
                                    lineage=envelope.lineage, key_id=envelope.key_id,
                                    nonce=envelope.nonce, issued_at=envelope.issued_at,
                                    expires_at=envelope.expires_at, key=producer.secret)
        if not hmac.compare_digest(expected, envelope.signature):
            return reject("signature_mismatch")
        # Namespace replay keys by tenant, key and nonce; reserve only after all checks.
        identifier = hashlib.sha256(
            f"{authorized_tenant_id}:{envelope.key_id}:{envelope.nonce}".encode()).hexdigest()
        if not replay_store.reserve_once(identifier, envelope.expires_at, now):
            return reject("replay_detected")
        return VerificationResult("verified", (), evidence_id)
    except (ValueError, TypeError, OverflowError, KeyError):
        return reject("invalid_envelope")
    except Exception:
        # Storage outage or unknown verification failure must never authenticate.
        return reject("verification_unavailable")
