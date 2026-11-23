import base64
from datetime import datetime, timezone
import unittest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from scripts.integration.fnd016_trusted_stop_reader import read_stop_snapshot
from scripts.integration.fnd016_signed_recovery_attestation import (
    DOMAIN, canonical, verify_recovery_attestation,
)


class TrustedRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime.now(timezone.utc)
        self.private = Ed25519PrivateKey.generate()
        self.payload = {
            "domain": DOMAIN, "tenantId": "tenant", "projectId": "project",
            "proposalId": "proposal", "originalDigest": "abc",
            "rollbackDigest": "def", "rehearsalPassed": True,
            "issuedAt": self.now.isoformat(), "keyId": "recovery-key-v1",
        }

    def document(self, payload=None):
        payload = payload or self.payload
        return {"payload": payload,
                "signature": base64.b64encode(self.private.sign(canonical(payload))).decode()}

    def test_valid_signature(self):
        attestation = verify_recovery_attestation(
            self.document(), self.private.public_key(), "recovery-key-v1")
        self.assertTrue(attestation.signed_by_independent_authority)

    def test_tampered_recovery_rejected(self):
        document = self.document()
        document["payload"]["rollbackDigest"] = "changed"
        with self.assertRaises(Exception):
            verify_recovery_attestation(document, self.private.public_key(), "recovery-key-v1")

    def test_wrong_key_id_rejected(self):
        with self.assertRaises(ValueError):
            verify_recovery_attestation(
                self.document(), self.private.public_key(), "other")

    def test_failed_rehearsal_rejected(self):
        payload = dict(self.payload, rehearsalPassed=False)
        with self.assertRaises(ValueError):
            verify_recovery_attestation(
                self.document(payload), self.private.public_key(), "recovery-key-v1")

    def test_missing_stop_record_fails_closed(self):
        snapshot = read_stop_snapshot(
            "tenant", "project", lambda sql, args: [], observed_at=self.now)
        self.assertTrue(snapshot.active)
        self.assertFalse(snapshot.authority_verified)

    def test_database_failure_fails_closed(self):
        def broken(sql, args):
            raise RuntimeError("database unavailable")
        snapshot = read_stop_snapshot("tenant", "project", broken, observed_at=self.now)
        self.assertTrue(snapshot.active)

    def test_trusted_active_stop(self):
        snapshot = read_stop_snapshot(
            "tenant", "project", lambda sql, args: [(1, 4)], observed_at=self.now)
        self.assertTrue(snapshot.active)
        self.assertEqual(snapshot.generation, 4)

    def test_trusted_inactive_stop(self):
        snapshot = read_stop_snapshot(
            "tenant", "project", lambda sql, args: [(0, 4)], observed_at=self.now)
        self.assertFalse(snapshot.active)
        self.assertTrue(snapshot.authority_verified)


if __name__ == "__main__":
    unittest.main()
