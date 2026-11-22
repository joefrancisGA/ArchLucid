import unittest
from dataclasses import replace
from scripts.integration.fnd014_isolated_dry_run import (
    DryRunAuthorization, RemediationStep, simulate_remediation,
)
from scripts.integration.fnd015_rollback_planner import (
    RollbackPlanningDecision, plan_rollout_and_rollback,
)
from scripts.integration.fnd016_isolated_recovery_rehearsal import rehearse_recovery


class IsolatedRecoveryRehearsalTests(unittest.TestCase):
    def setUp(self):
        self.source = {"r1": {"public": "true", "owner": "team"}}
        self.steps = [RemediationStep("set-property", "r1", "public", "true", "false")]
        self.dry = simulate_remediation(
            self.source, self.steps, principal_id="operator", tenant_id="t",
            project_id="p", proposal_id="proposal",
            decision=DryRunAuthorization("operator", "t", "p", "proposal",
                                         "remediation.simulate", True, "d1"))
        self.rollback = plan_rollout_and_rollback(
            self.dry, tenant_id="t", proposal_id="proposal",
            evidence_refs=["e1"], deployment_policy_ref="policy",
            decision=RollbackPlanningDecision(True, "remediation.plan", "t", "proposal", "d2"))

    def run_rehearsal(self, source=None, steps=None, rollback=None):
        return rehearse_recovery(
            source if source is not None else self.source,
            steps if steps is not None else self.steps,
            tenant_id="t", project_id="p", proposal_id="proposal",
            dry_run=self.dry, rollback=rollback if rollback is not None else self.rollback)

    def test_round_trip_restores_original_digest(self):
        result = self.run_rehearsal()
        self.assertEqual(result.status, "passed")
        self.assertEqual(result.original_digest, result.rollback_digest)
        self.assertEqual(self.source["r1"]["public"], "true")

    def test_stale_source_rejected(self):
        result = self.run_rehearsal(source={"r1": {"public": "changed", "owner": "team"}})
        self.assertEqual(result.reasons, ("source_state_changed",))

    def test_tampered_inverse_rejected(self):
        bad = replace(self.rollback, inverse_steps=(
            RemediationStep("set-property", "r1", "public", "false", "incorrect"),))
        self.assertEqual(self.run_rehearsal(rollback=bad).reasons, ("rollback_replay_mismatch",))

    def test_missing_inverse_rejected(self):
        bad = replace(self.rollback, inverse_steps=())
        self.assertEqual(self.run_rehearsal(rollback=bad).reasons, ("inverse_steps_incomplete",))

    def test_foreign_scope_rejected(self):
        bad = replace(self.rollback, document=dict(self.rollback.document, tenantId="foreign"))
        self.assertEqual(self.run_rehearsal(rollback=bad).reasons, ("rollback_scope_mismatch",))

    def test_forward_drift_rejected(self):
        wrong = [RemediationStep("set-property", "r1", "owner", "team", "other")]
        self.assertNotEqual(self.run_rehearsal(steps=wrong).status, "passed")

    def test_rejected_plan_rejected(self):
        bad = replace(self.rollback, status="rejected")
        self.assertEqual(self.run_rehearsal(rollback=bad).reasons, ("rollback_not_planned",))


if __name__ == "__main__":
    unittest.main()
