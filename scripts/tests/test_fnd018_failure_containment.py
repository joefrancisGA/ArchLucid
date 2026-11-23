import unittest
from dataclasses import replace

from scripts.integration.fnd018_failure_containment import (
    Capability, ContainmentDecision, Dependency, FailureFacts, Health, Mode,
    RecoveryState, assess_containment, transition_recovery,
)


def facts(**overrides):
    status = {dependency: Health.HEALTHY for dependency in Dependency}
    status.update(overrides.pop("status", {}))
    return FailureFacts(status=status, evidence_verified=overrides.pop("evidence_verified", True),
                        authorization_verified=overrides.pop("authorization_verified", True),
                        audit_writable=overrides.pop("audit_writable", True),
                        emergency_stop_active=overrides.pop("emergency_stop_active", False))


class FailureContainmentTests(unittest.TestCase):
    def test_healthy_still_disables_execution(self):
        result = assess_containment(facts())
        self.assertEqual(result.mode, Mode.HEALTHY)
        self.assertNotIn(Capability.EXECUTE_REMEDIATION, result.allowed)
        self.assertFalse(result.eligible_for_execution)

    def test_ai_failure_preserves_verified_evidence(self):
        result = assess_containment(facts(status={Dependency.AI_REASONING: Health.FAILED}))
        self.assertEqual(result.mode, Mode.DEGRADED)
        self.assertIn(Capability.VIEW_VERIFIED_EVIDENCE, result.allowed)
        self.assertNotIn(Capability.NEW_AI_ANALYSIS, result.allowed)

    def test_authorization_failure_isolates(self):
        result = assess_containment(facts(status={Dependency.AUTHORIZATION: Health.FAILED}))
        self.assertEqual(result.mode, Mode.ISOLATED)
        self.assertFalse(result.allowed)

    def test_unknown_audit_health_isolates(self):
        result = assess_containment(facts(status={Dependency.AUDIT: Health.UNKNOWN}))
        self.assertEqual(result.mode, Mode.ISOLATED)

    def test_unverified_evidence_isolates(self):
        self.assertEqual(assess_containment(facts(evidence_verified=False)).mode, Mode.ISOLATED)

    def test_audit_write_failure_isolates(self):
        self.assertEqual(assess_containment(facts(audit_writable=False)).mode, Mode.ISOLATED)

    def test_emergency_stop_blocks_planning(self):
        result = assess_containment(facts(emergency_stop_active=True))
        self.assertNotIn(Capability.PLAN_REMEDIATION, result.allowed)

    def test_missing_dependency_inventory_isolates(self):
        broken = facts(status={Dependency.AI_REASONING: Health.HEALTHY})
        broken.status.pop(Dependency.AUDIT)
        self.assertEqual(assess_containment(broken).mode, Mode.ISOLATED)

    def test_missing_stop_fact_does_not_enable_planning_or_ai(self):
        # The dataclass default represents unknown, never an implicitly cleared stop.
        incomplete = FailureFacts(
            status={dependency: Health.HEALTHY for dependency in Dependency},
            evidence_verified=True, authorization_verified=True, audit_writable=True)
        decision = assess_containment(incomplete)
        self.assertEqual(decision.mode, Mode.DEGRADED)
        self.assertEqual(decision.reasons, ("emergency_stop_unverified",))
        self.assertEqual(decision.allowed, frozenset({Capability.VIEW_VERIFIED_EVIDENCE}))

    def test_ambiguous_stop_fact_cannot_clear_stop(self):
        for ambiguous in (None, 0, 1, "false", "0"):
            with self.subTest(ambiguous=ambiguous):
                decision = assess_containment(replace(facts(), emergency_stop_active=ambiguous))
                self.assertEqual(decision.mode, Mode.DEGRADED)
                self.assertEqual(decision.reasons, ("emergency_stop_unverified",))
                self.assertNotIn(Capability.PLAN_REMEDIATION, decision.allowed)
                self.assertNotIn(Capability.NEW_AI_ANALYSIS, decision.allowed)

    def test_truthy_nonboolean_critical_proofs_fail_closed(self):
        for field in ("authorization_verified", "audit_writable", "evidence_verified"):
            for untrusted in ("false", 1, None):
                with self.subTest(field=field, untrusted=untrusted):
                    decision = assess_containment(replace(facts(), **{field: untrusted}))
                    self.assertEqual(decision.mode, Mode.ISOLATED)
                    self.assertFalse(decision.allowed)

    def test_recovery_requires_literal_boolean_independent_proof(self):
        healthy = assess_containment(facts())
        for untrusted in ("false", 1, None):
            with self.subTest(untrusted=untrusted):
                state = transition_recovery(
                    RecoveryState(Mode.RECOVERING, 1), healthy,
                    independent_recovery_verified=untrusted)
                self.assertEqual(state, RecoveryState(Mode.RECOVERING, 0))

    def test_recovery_requires_independent_verification_and_two_observations(self):
        healthy = assess_containment(facts())
        state = transition_recovery(RecoveryState(Mode.ISOLATED), healthy,
                                    independent_recovery_verified=False)
        self.assertEqual(state.mode, Mode.RECOVERING)
        state = transition_recovery(state, healthy, independent_recovery_verified=True)
        self.assertEqual(state.mode, Mode.RECOVERING)
        state = transition_recovery(state, healthy, independent_recovery_verified=True)
        self.assertEqual(state.mode, Mode.HEALTHY)

    def test_new_failure_resets_recovery(self):
        state = transition_recovery(RecoveryState(Mode.RECOVERING, 1),
                                    assess_containment(facts(audit_writable=False)),
                                    independent_recovery_verified=True)
        self.assertEqual(state, RecoveryState(Mode.ISOLATED, 0))


if __name__ == "__main__":
    unittest.main()
