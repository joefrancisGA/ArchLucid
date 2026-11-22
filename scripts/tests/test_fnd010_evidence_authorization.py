import hashlib
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

from scripts.integration.fnd005_canonical_adapter import TrustedProducer
from scripts.integration.fnd005_signed_envelope import (
    InMemoryReplayStore, SignedEvidenceEnvelope, sign_full_record,
)
from scripts.integration.fnd010_evidence_authorization import (
    AuthorizationDecision, EvidenceAccessRequest, retrieve_and_verify,
)


class EvidenceAuthorizationBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 22, 12, tzinfo=timezone.utc)
        self.request = EvidenceAccessRequest("principal-a", "tenant-a", "workspace-a",
                                             "project-a", "run-a", "snapshot-a", "evidence-a")
        self.content = b"trusted evidence"
        self.key = b"test-key-material-at-least-thirty-two-bytes"
        self.lineage = dict(workspace_id="workspace-a", project_id="project-a",
                            run_id="run-a", snapshot_id="snapshot-a", evidence_id="evidence-a")
        self.record = dict(schemaVersion="1.0.0", evidenceId="evidence-a", tenantId="tenant-a",
                           integrity=dict(algorithm="sha256",
                                          digest=hashlib.sha256(self.content).hexdigest()))
        issued = self.now - timedelta(seconds=10)
        expires = self.now + timedelta(seconds=30)
        signature = sign_full_record(self.record, tenant_id="tenant-a", lineage=self.lineage,
                                     key_id="key-a", nonce="nonce-unique-123456789",
                                     issued_at=issued, expires_at=expires, key=self.key)
        self.envelope = SignedEvidenceEnvelope(self.record, "tenant-a", self.lineage,
                                               "key-a", "nonce-unique-123456789",
                                               issued, expires, signature)
        self.decisions = Mock()
        self.decisions.decide.return_value = AuthorizationDecision(
            True, "principal-a", "evidence.read", "tenant-a", "evidence-a", "decision-a")
        self.repo = Mock()
        self.repo.load_authorized.return_value = (self.envelope, self.content)
        self.keyring = {"key-a": TrustedProducer(
            "key-a", self.key, self.now - timedelta(days=1), self.now + timedelta(days=1))}
        self.store = InMemoryReplayStore()

    def check(self, request=None):
        return retrieve_and_verify(request or self.request, decisions=self.decisions,
                                   repository=self.repo, keyring=self.keyring,
                                   replay_store=self.store, now=self.now)

    def test_authorized_scoped_evidence_verified(self):
        self.assertEqual("verified", self.check().status)
        self.repo.load_authorized.assert_called_once_with(self.request)

    def test_denied_decision_never_fetches(self):
        self.decisions.decide.return_value = replace(self.decisions.decide.return_value, allowed=False)
        self.assertEqual("denied", self.check().status)
        self.repo.load_authorized.assert_not_called()

    def test_foreign_tenant_decision_never_fetches(self):
        self.decisions.decide.return_value = replace(self.decisions.decide.return_value,
                                                     tenant_id="tenant-b")
        self.assertEqual("denied", self.check().status)
        self.repo.load_authorized.assert_not_called()

    def test_wrong_principal_decision_never_fetches(self):
        self.decisions.decide.return_value = replace(self.decisions.decide.return_value,
                                                     principal_id="principal-b")
        self.assertEqual("denied", self.check().status)
        self.repo.load_authorized.assert_not_called()

    def test_authorization_outage_never_fetches(self):
        self.decisions.decide.side_effect = RuntimeError("offline")
        self.assertEqual("denied", self.check().status)
        self.repo.load_authorized.assert_not_called()

    def test_unsupported_action_never_calls_decider(self):
        self.assertEqual("denied", self.check(replace(self.request, action="evidence.write")).status)
        self.decisions.decide.assert_not_called()
        self.repo.load_authorized.assert_not_called()

    def test_resource_mismatch_rejected(self):
        self.repo.load_authorized.return_value = (
            replace(self.envelope, record={**self.record, "evidenceId": "other"}), self.content)
        self.assertEqual("rejected", self.check().status)

    def test_repository_outage_rejected(self):
        self.repo.load_authorized.side_effect = RuntimeError("offline")
        self.assertEqual("rejected", self.check().status)


if __name__ == "__main__":
    unittest.main()
