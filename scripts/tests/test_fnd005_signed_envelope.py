import hashlib
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone

from scripts.integration.fnd005_canonical_adapter import TrustedProducer
from scripts.integration.fnd005_signed_envelope import (
    InMemoryReplayStore, SignedEvidenceEnvelope, sign_full_record, verify_signed_envelope,
)


class FullRecordReplayTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 22, 12, 0, tzinfo=timezone.utc)
        self.key = b"test-only-full-record-key-material-32-bytes"
        self.data = b"evidence bytes"
        self.record = {
            "schemaVersion": "1.0.0", "evidenceId": "e-1", "tenantId": "tenant-a",
            "source": {"system": "scanner", "reference": "object-1", "collectorVersion": "1"},
            "capturedAt": "2026-11-22T11:00:00Z", "provenanceKind": "ObservedFact",
            "integrity": {"algorithm": "sha256", "digest": hashlib.sha256(self.data).hexdigest()},
            "verificationStatus": "unverified",
        }
        self.lineage = {"workspace_id": "w", "project_id": "p", "run_id": "r", "snapshot_id": "s"}
        self.keys = {"k1": TrustedProducer("k1", self.key, self.now - timedelta(days=1),
                                            self.now + timedelta(days=1))}
        self.store = InMemoryReplayStore()
        self.env = self.make_env()

    def make_env(self):
        issued = self.now - timedelta(seconds=10)
        expires = self.now + timedelta(seconds=50)
        sig = sign_full_record(self.record, tenant_id="tenant-a", lineage=self.lineage,
                               key_id="k1", nonce="unique-nonce-12345678", issued_at=issued,
                               expires_at=expires, key=self.key)
        return SignedEvidenceEnvelope(self.record, "tenant-a", self.lineage, "k1",
                                      "unique-nonce-12345678", issued, expires, sig)

    def verify(self, env=None, **kwargs):
        args = dict(authorized_tenant_id="tenant-a", trusted_lineage=self.lineage,
                    keyring=self.keys, replay_store=self.store, now=self.now)
        args.update(kwargs)
        return verify_signed_envelope(env or self.env, self.data, **args)

    def test_first_use_verified_second_use_rejected(self):
        self.assertEqual("verified", self.verify().status)
        self.assertEqual(("replay_detected",), self.verify().reasons)

    def test_modified_source_metadata_rejected(self):
        changed = {**self.record, "source": {**self.record["source"], "reference": "forged"}}
        self.assertEqual("rejected", self.verify(replace(self.env, record=changed)).status)

    def test_modified_provenance_rejected(self):
        self.assertEqual("rejected", self.verify(replace(self.env,
            record={**self.record, "provenanceKind": "AiInference"})).status)

    def test_wrong_tenant_rejected(self):
        self.assertEqual("rejected", self.verify(authorized_tenant_id="tenant-b").status)

    def test_expired_envelope_rejected(self):
        self.assertEqual("rejected", self.verify(now=self.now + timedelta(minutes=2)).status)

    def test_key_rotation_rejected(self):
        self.assertEqual("rejected", self.verify(keyring={}).status)

    def test_replay_store_failure_closed(self):
        class BrokenStore:
            def reserve_once(self, *args):
                raise RuntimeError("store unavailable")
        self.assertEqual(("verification_unavailable",), self.verify(replay_store=BrokenStore()).reasons)

    def test_payload_tampering_rejected(self):
        self.assertEqual("rejected", verify_signed_envelope(
            self.env, b"wrong", authorized_tenant_id="tenant-a", trusted_lineage=self.lineage,
            keyring=self.keys, replay_store=self.store, now=self.now).status)


if __name__ == "__main__":
    unittest.main()
