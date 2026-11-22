import hashlib
import unittest
from dataclasses import replace

from scripts.integration.fnd005_evidence_verifier import (
    EvidenceClaim, sign_claim, verify_evidence,
)

KEY = b"trusted-test-key-material-not-for-production-123456"


class EvidenceVerifierTests(unittest.TestCase):
    def setUp(self):
        self.content = b'{"resource":"example"}'
        self.claim = EvidenceClaim(
            tenant_id="tenant-a", workspace_id="workspace-a", project_id="project-a",
            run_id="run-1", snapshot_id="snapshot-1", evidence_id="evidence-1",
            sha256=hashlib.sha256(self.content).hexdigest(),
        )
        self.scope = {k: getattr(self.claim, k) for k in
                      ("tenant_id", "workspace_id", "project_id", "run_id", "snapshot_id")}

    def test_authenticated_evidence_is_verified(self):
        signed = replace(self.claim, signature=sign_claim(self.claim, KEY))
        self.assertEqual("verified", verify_evidence(self.content, signed, self.scope, trusted_hmac_key=KEY).status)

    def test_sha_only_is_not_producer_authentication(self):
        result = verify_evidence(self.content, self.claim, self.scope)
        self.assertEqual("unverified", result.status)

    def test_tampered_bytes_are_rejected(self):
        signed = replace(self.claim, signature=sign_claim(self.claim, KEY))
        self.assertEqual("rejected", verify_evidence(b"tampered", signed, self.scope, trusted_hmac_key=KEY).status)

    def test_cross_tenant_claim_is_rejected(self):
        signed = replace(self.claim, signature=sign_claim(self.claim, KEY))
        self.assertEqual("rejected", verify_evidence(self.content, signed, {**self.scope, "tenant_id": "tenant-b"}, trusted_hmac_key=KEY).status)

    def test_wrong_snapshot_is_rejected(self):
        signed = replace(self.claim, signature=sign_claim(self.claim, KEY))
        self.assertEqual("rejected", verify_evidence(self.content, signed, {**self.scope, "snapshot_id": "other"}, trusted_hmac_key=KEY).status)

    def test_forged_signature_is_rejected(self):
        signed = replace(self.claim, signature="0" * 64)
        self.assertEqual("rejected", verify_evidence(self.content, signed, self.scope, trusted_hmac_key=KEY).status)

    def test_missing_scope_is_rejected(self):
        self.assertEqual("rejected", verify_evidence(self.content, self.claim, {}).status)

    def test_short_signing_key_is_rejected(self):
        with self.assertRaises(ValueError):
            sign_claim(self.claim, b"short")


if __name__ == "__main__":
    unittest.main()
