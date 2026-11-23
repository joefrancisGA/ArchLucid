import copy
from datetime import datetime, timezone
import unittest

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from scripts.integration.fnd016_evidence_bound_attestation import (
    prepare_attestation, issue_with_external_signer,
    verify_evidence_bound_attestation,
)


class EvidenceBoundAttestationTests(unittest.TestCase):
    def setUp(self):
        self.key = Ed25519PrivateKey.generate()
        self.evidence = {
            "schemaVersion": "1.0.0", "tenantId": "t", "projectId": "p",
            "proposalId": "proposal", "originalDigest": "ab" * 32,
            "simulatedDigest": "cd" * 32, "rollbackDigest": "ab" * 32,
            "forwardDecisionId": "forward", "reverseDecisionId": "reverse",
            "rehearsalPassed": True, "isolation": "in-memory-only",
        }
        self.payload = prepare_attestation(self.evidence, key_id="independent-v1",
                                           issued_at=datetime.now(timezone.utc))
        self.signed = issue_with_external_signer(self.payload, self.key.sign)

    def verify(self, document=None, evidence=None, key=None):
        return verify_evidence_bound_attestation(
            document if document is not None else self.signed,
            evidence if evidence is not None else self.evidence,
            key if key is not None else self.key.public_key(), "independent-v1")

    def test_valid_independently_signed_rehearsal(self):
        self.assertTrue(self.verify().signed_by_independent_authority)

    def test_evidence_tampering_detected(self):
        evidence = dict(self.evidence, forwardDecisionId="forged")
        with self.assertRaises(ValueError):
            self.verify(evidence=evidence)

    def test_wrong_proposal_detected(self):
        evidence = dict(self.evidence, proposalId="foreign")
        with self.assertRaises(ValueError):
            self.verify(evidence=evidence)

    def test_wrong_signing_key_detected(self):
        with self.assertRaises(Exception):
            self.verify(key=Ed25519PrivateKey.generate().public_key())

    def test_signature_tampering_detected(self):
        document = copy.deepcopy(self.signed)
        document["payload"]["rehearsalPassed"] = False
        with self.assertRaises(ValueError):
            self.verify(document=document)

    def test_incomplete_recovery_refused(self):
        evidence = dict(self.evidence, rollbackDigest="wrong")
        with self.assertRaises(ValueError):
            prepare_attestation(evidence, key_id="independent-v1",
                                issued_at=datetime.now(timezone.utc))

    def test_unknown_isolation_refused(self):
        evidence = dict(self.evidence, isolation="production")
        with self.assertRaises(ValueError):
            prepare_attestation(evidence, key_id="independent-v1",
                                issued_at=datetime.now(timezone.utc))


if __name__ == "__main__":
    unittest.main()
