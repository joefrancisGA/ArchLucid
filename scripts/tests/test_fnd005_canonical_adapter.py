import hashlib
import unittest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from scripts.integration.fnd005_canonical_adapter import TrustedProducer, verify_canonical_record
from scripts.integration.fnd005_evidence_verifier import EvidenceClaim, sign_claim


class CanonicalAdapterTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 22, tzinfo=timezone.utc)
        self.ids = {name: str(uuid4()) for name in
                    ("tenant_id", "workspace_id", "project_id", "run_id", "snapshot_id", "evidence_id")}
        self.data = b"sample evidence"
        self.record = {
            "schemaVersion": "1.0.0", "evidenceId": self.ids["evidence_id"],
            "tenantId": self.ids["tenant_id"],
            "source": {"system": "test", "reference": "artifact-1", "collectorVersion": "1"},
            "capturedAt": "2026-11-21T00:00:00Z", "provenanceKind": "ObservedFact",
            "integrity": {"algorithm": "sha256", "digest": hashlib.sha256(self.data).hexdigest()},
            "verificationStatus": "unverified",
        }
        self.key = b"test-only-producer-secret-at-least-32-bytes!"
        self.producer = TrustedProducer("key-1", self.key, self.now - timedelta(days=1),
                                        self.now + timedelta(days=1))
        self.lineage = {k: self.ids[k] for k in
                        ("workspace_id", "project_id", "run_id", "snapshot_id", "evidence_id")}
        self.claim = EvidenceClaim(**self.ids, sha256=self.record["integrity"]["digest"])
        self.signature = sign_claim(self.claim, self.key)

    def verify(self, **changes):
        args = dict(record=self.record, content=self.data,
                    expected_tenant_id=self.ids["tenant_id"],
                    expected_lineage=self.lineage, keyring={"key-1": self.producer},
                    signature=self.signature, key_id="key-1", verified_at=self.now)
        args.update(changes)
        return verify_canonical_record(**args)

    def test_valid_signed_record(self):
        self.assertEqual("verified", self.verify().status)

    def test_tampering_rejected(self):
        self.assertEqual("rejected", self.verify(content=b"altered").status)

    def test_cross_tenant_rejected(self):
        self.assertEqual("rejected", self.verify(expected_tenant_id=str(uuid4())).status)

    def test_missing_lineage_binding_rejected(self):
        self.assertEqual("rejected", self.verify(expected_lineage={}).status)

    def test_unknown_key_rejected(self):
        self.assertEqual("rejected", self.verify(key_id="untrusted").status)

    def test_expired_key_rejected(self):
        expired = TrustedProducer("key-1", self.key, self.now - timedelta(days=2),
                                  self.now - timedelta(days=1))
        self.assertEqual("rejected", self.verify(keyring={"key-1": expired}).status)

    def test_unsigned_evidence_is_unverified(self):
        self.assertEqual("unverified", self.verify(signature=None, key_id=None).status)

    def test_future_capture_rejected(self):
        record = {**self.record, "capturedAt": "2027-01-01T00:00:00Z"}
        self.assertEqual("rejected", self.verify(record=record).status)


if __name__ == "__main__":
    unittest.main()
