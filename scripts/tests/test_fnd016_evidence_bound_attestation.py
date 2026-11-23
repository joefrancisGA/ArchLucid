import copy
from datetime import datetime, timezone
import unittest
from unittest.mock import Mock

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from scripts.integration.fnd014_isolated_dry_run import (
    DryRunAuthorization, RemediationStep, simulate_remediation,
)
from scripts.integration.fnd015_rollback_planner import (
    RollbackPlanningDecision, plan_rollout_and_rollback,
)
from scripts.integration.fnd016_isolated_recovery_rehearsal import (
    rehearse_recovery, remediation_steps_sha256,
)
from scripts.integration.fnd016_remediation_safety_controller import SafetyDecision
from scripts.integration.fnd016_recovery_stop_gate import (
    StopSnapshot, assess_recovery_and_stop,
)
from scripts.integration.fnd016_evidence_bound_attestation import (
    prepare_attestation, issue_with_external_signer,
    verify_evidence_bound_attestation,
)


class EvidenceBoundAttestationTests(unittest.TestCase):
    def setUp(self):
        self.key = Ed25519PrivateKey.generate()
        self.forward = [RemediationStep("set-property", "resource", "public", "true", "false")]
        self.inverse = [RemediationStep("set-property", "resource", "public", "false", "true")]
        self.evidence = {
            "schemaVersion": "1.1.0", "tenantId": "t", "projectId": "p",
            "proposalId": "proposal", "originalDigest": "ab" * 32,
            "simulatedDigest": "cd" * 32, "rollbackDigest": "ab" * 32,
            "forwardDecisionId": "forward", "reverseDecisionId": "reverse",
            "forwardStepsSha256": remediation_steps_sha256(self.forward),
            "inverseStepsSha256": remediation_steps_sha256(self.inverse),
            "rehearsalPassed": True, "isolation": "in-memory-only",
        }
        self.payload = prepare_attestation(self.evidence, key_id="independent-v1",
                                           issued_at=datetime.now(timezone.utc))
        self.signed = issue_with_external_signer(
            self.payload, self.key.sign, evidence=self.evidence,
            expected_forward_steps=self.forward, expected_inverse_steps=self.inverse)

    def verify(self, document=None, evidence=None, key=None, forward=None, inverse=None):
        return verify_evidence_bound_attestation(
            document if document is not None else self.signed,
            evidence if evidence is not None else self.evidence,
            key if key is not None else self.key.public_key(), "independent-v1",
            expected_forward_steps=self.forward if forward is None else forward,
            expected_inverse_steps=self.inverse if inverse is None else inverse)

    def test_valid_independently_signed_rehearsal(self):
        self.assertTrue(self.verify().signed_by_independent_authority)

    def test_signer_is_not_called_for_unreviewed_forward_plan(self):
        signer = Mock(return_value=b"x" * 64)
        unreviewed = [
            RemediationStep("set-property", "resource", "public", "true", "intermediate"),
            RemediationStep("set-property", "resource", "public", "intermediate", "false"),
        ]
        with self.assertRaisesRegex(ValueError, "expected steps"):
            issue_with_external_signer(
                self.payload, signer, evidence=self.evidence,
                expected_forward_steps=unreviewed,
                expected_inverse_steps=self.inverse)
        signer.assert_not_called()

    def test_signer_is_not_called_for_unreviewed_inverse_or_evidence(self):
        for invalid_evidence, invalid_inverse in (
            (self.evidence, [
                RemediationStep("set-property", "resource", "public", "false", "unsafe"),
                RemediationStep("set-property", "resource", "public", "unsafe", "true"),
            ]),
            (dict(self.evidence, forwardDecisionId="substituted"), self.inverse),
        ):
            with self.subTest(invalid_evidence=invalid_evidence,
                              invalid_inverse=invalid_inverse):
                signer = Mock(return_value=b"x" * 64)
                with self.assertRaises(ValueError):
                    issue_with_external_signer(
                        self.payload, signer, evidence=invalid_evidence,
                        expected_forward_steps=self.forward,
                        expected_inverse_steps=invalid_inverse)
                signer.assert_not_called()

    def test_signer_is_not_called_for_payload_scope_or_timestamp_mismatch(self):
        for field, value in (
            ("tenantId", "foreign"),
            ("issuedAt", "not-a-timestamp"),
            ("rehearsalPassed", False),
        ):
            with self.subTest(field=field):
                payload = dict(self.payload, **{field: value})
                signer = Mock(return_value=b"x" * 64)
                with self.assertRaises(ValueError):
                    issue_with_external_signer(
                        payload, signer, evidence=self.evidence,
                        expected_forward_steps=self.forward,
                        expected_inverse_steps=self.inverse)
                signer.assert_not_called()

    def test_matching_verified_inputs_reach_external_signer_once(self):
        signer = Mock(side_effect=self.key.sign)
        signed = issue_with_external_signer(
            self.payload, signer, evidence=self.evidence,
            expected_forward_steps=self.forward,
            expected_inverse_steps=self.inverse)
        signer.assert_called_once()
        self.assertTrue(self.verify(document=signed).signed_by_independent_authority)

    def test_alternate_forward_path_with_same_final_digest_is_rejected(self):
        # The supplied signed record is authentic, but it does not bind to
        # this separately supplied ordered plan: the new plan's intermediate
        # states differ while its before/after model digests can be identical.
        other = [
            RemediationStep("set-property", "resource", "public", "true", "middle"),
            RemediationStep("set-property", "resource", "public", "middle", "false"),
        ]
        with self.assertRaisesRegex(ValueError, "expected steps"):
            self.verify(forward=other)

    def test_alternate_inverse_path_is_rejected(self):
        other = [
            RemediationStep("set-property", "resource", "public", "false", "unsafe"),
            RemediationStep("set-property", "resource", "public", "unsafe", "true"),
        ]
        with self.assertRaisesRegex(ValueError, "expected steps"):
            self.verify(inverse=other)

    def test_legacy_v2_envelope_is_not_mislabeled_as_input_bound(self):
        legacy = copy.deepcopy(self.signed)
        legacy["payload"]["domain"] = "archlucid.fnd016.recovery-rehearsal.v2"
        with self.assertRaisesRegex(ValueError, "domain"):
            self.verify(document=legacy)

    def test_invalid_evidence_schema_version_rejected(self):
        bad = dict(self.evidence, schemaVersion="1.0.0")
        with self.assertRaisesRegex(ValueError, "Unsuccessful"):
            prepare_attestation(bad, key_id="independent-v1",
                                issued_at=datetime.now(timezone.utc))

    def test_malformed_step_binding_rejected(self):
        bad = dict(self.evidence, forwardStepsSha256="not-a-hash")
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            prepare_attestation(bad, key_id="independent-v1",
                                issued_at=datetime.now(timezone.utc))

    def test_rehearsal_evidence_is_bound_to_ordered_plan_and_never_grants_execution(self):
        source = {"resource": {"public": "true"}}
        forward = simulate_remediation(
            source, self.forward, principal_id="operator",
            tenant_id="t", project_id="p", proposal_id="proposal",
            decision=DryRunAuthorization(
                "operator", "t", "p", "proposal", "remediation.simulate", True, "decision-1"))
        rollback = plan_rollout_and_rollback(
            forward, tenant_id="t", proposal_id="proposal",
            evidence_refs=["evidence-1"], deployment_policy_ref="policy",
            decision=RollbackPlanningDecision(True, "remediation.plan", "t", "proposal", "decision-2"))
        rehearsal = rehearse_recovery(
            source, self.forward, tenant_id="t", project_id="p",
            proposal_id="proposal", dry_run=forward, rollback=rollback)
        self.assertEqual("passed", rehearsal.status)
        self.assertEqual(remediation_steps_sha256(self.forward),
                         rehearsal.evidence["forwardStepsSha256"])
        self.assertEqual(remediation_steps_sha256(rollback.inverse_steps),
                         rehearsal.evidence["inverseStepsSha256"])

        signed = issue_with_external_signer(
            prepare_attestation(rehearsal.evidence, key_id="independent-v1",
                                issued_at=datetime.now(timezone.utc)), self.key.sign,
            evidence=rehearsal.evidence, expected_forward_steps=self.forward,
            expected_inverse_steps=rollback.inverse_steps)
        verified = self.verify(document=signed, evidence=rehearsal.evidence,
                               forward=self.forward, inverse=rollback.inverse_steps)
        decision = assess_recovery_and_stop(
            SafetyDecision("review_required", ("independent_recovery_validation_required",)),
            StopSnapshot("t", "p", False, 3, verified.issued_at, True),
            verified,
            tenant_id="t", project_id="p", proposal_id="proposal",
            original_digest=forward.original_digest,
            rollback_digest=rehearsal.rollback_digest,
            now=verified.issued_at)
        self.assertEqual("review_required", decision.status)
        self.assertFalse(decision.eligible_for_execution)

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
