import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone

from scripts.integration.fnd016_remediation_safety_controller import SafetyDecision
from scripts.integration.fnd016_recovery_stop_gate import (
    StopSnapshot, RecoveryAttestation, assess_recovery_and_stop,
)


class RecoveryStopGateTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 22, tzinfo=timezone.utc)
        self.preliminary = SafetyDecision("review_required", ("independent_recovery_validation_required",))
        self.stop = StopSnapshot("t", "p", False, 3, self.now, True)
        self.attestation = RecoveryAttestation(
            "t", "p", "proposal", "original", "rollback", True, True, self.now)

    def assess(self, stop=None, attestation=None, preliminary=None):
        return assess_recovery_and_stop(
            preliminary if preliminary is not None else self.preliminary,
            stop if stop is not None else self.stop,
            attestation if attestation is not None else self.attestation,
            tenant_id="t", project_id="p", proposal_id="proposal",
            original_digest="original", rollback_digest="rollback", now=self.now)

    def test_valid_evidence_does_not_enable_execution(self):
        decision = self.assess()
        self.assertEqual(decision.status, "review_required")
        self.assertFalse(decision.eligible_for_execution)

    def test_stop_active(self):
        self.assertEqual(self.assess(stop=replace(self.stop, active=True)).reasons, ("emergency_stop",))

    def test_stale_stop(self):
        self.assertEqual(self.assess(stop=replace(
            self.stop, observed_at=self.now-timedelta(minutes=6))).reasons, ("stop_state_stale",))

    def test_missing_stop(self):
        self.assertEqual(self.assess(stop=replace(self.stop, authority_verified=False)).reasons,
                         ("stop_state_unavailable",))

    def test_unsigned_recovery(self):
        self.assertEqual(self.assess(attestation=replace(
            self.attestation, signed_by_independent_authority=False)).reasons,
            ("recovery_not_independently_verified",))

    def test_failed_rehearsal(self):
        self.assertEqual(self.assess(attestation=replace(
            self.attestation, rehearsal_passed=False)).reasons,
            ("recovery_not_independently_verified",))

    def test_foreign_proposal(self):
        self.assertEqual(self.assess(attestation=replace(
            self.attestation, proposal_id="foreign")).reasons, ("recovery_binding_mismatch",))

    def test_stale_recovery(self):
        self.assertEqual(self.assess(attestation=replace(
            self.attestation, issued_at=self.now-timedelta(minutes=6))).reasons,
            ("recovery_attestation_stale",))

    def test_invalid_preliminary(self):
        self.assertEqual(self.assess(preliminary=SafetyDecision("rejected", ("risk",))).reasons,
                         ("preliminary_safety_not_verified",))


if __name__ == "__main__":
    unittest.main()
