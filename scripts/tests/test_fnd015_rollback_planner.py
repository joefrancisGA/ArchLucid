import unittest
from dataclasses import replace

from scripts.integration.fnd014_isolated_dry_run import (
    DryRunAuthorization, RemediationStep, simulate_remediation,
)
from scripts.integration.fnd015_rollback_planner import (
    RollbackPlanningDecision, plan_rollout_and_rollback,
)


class RollbackPlannerTests(unittest.TestCase):
    def setUp(self):
        self.source = {"vm-a": {"public": "true", "owner": "team"}}
        self.simulation = simulate_remediation(
            self.source, [RemediationStep("set-property", "vm-a", "public", "true", "false")],
            principal_id="alice", tenant_id="tenant-a", project_id="project-a",
            proposal_id="proposal-a",
            decision=DryRunAuthorization("alice", "tenant-a", "project-a",
                                         "proposal-a", "remediation.simulate", True, "sim-decision"))
        self.decision = RollbackPlanningDecision(
            True, "remediation.plan", "tenant-a", "proposal-a", "plan-decision")

    def plan(self, simulation=None, decision=None, evidence_refs=None):
        return plan_rollout_and_rollback(
            self.simulation if simulation is None else simulation,
            tenant_id="tenant-a", proposal_id="proposal-a",
            evidence_refs=["evidence-1"] if evidence_refs is None else evidence_refs,
            deployment_policy_ref="policy-1",
            decision=self.decision if decision is None else decision)

    def test_plan_is_inert_and_contains_inverse(self):
        result = self.plan()
        self.assertEqual("planned", result.status)
        self.assertEqual("planned", result.document["rolloutStatus"])
        self.assertEqual("pending", result.document["preflight"]["status"])
        self.assertEqual(RemediationStep("set-property", "vm-a", "public", "false", "true"),
                         result.inverse_steps[0])
        self.assertEqual("true", self.source["vm-a"]["public"])

    def test_denied_planning_rejected(self):
        self.assertEqual("rejected", self.plan(decision=replace(self.decision, allowed=False)).status)

    def test_boolean_like_planning_approval_rejected(self):
        for untrusted in ("false", "true", 1, 2, None):
            with self.subTest(untrusted=untrusted):
                outcome = self.plan(decision=replace(self.decision, allowed=untrusted))
                self.assertEqual("rejected", outcome.status)
                self.assertEqual(("not_authorized",), outcome.reasons)
                self.assertIsNone(outcome.document)
                self.assertEqual((), outcome.inverse_steps)

    def test_chained_changes_to_one_property_revert_in_reverse_order(self):
        forward = simulate_remediation(
            self.source,
            [RemediationStep("set-property", "vm-a", "public", "true", "middle"),
             RemediationStep("set-property", "vm-a", "public", "middle", "false")],
            principal_id="alice", tenant_id="tenant-a", project_id="project-a",
            proposal_id="proposal-a",
            decision=DryRunAuthorization("alice", "tenant-a", "project-a",
                                         "proposal-a", "remediation.simulate",
                                         True, "sim-decision"))
        outcome = self.plan(simulation=forward)
        self.assertEqual("planned", outcome.status)
        self.assertEqual((
            RemediationStep("set-property", "vm-a", "public", "false", "middle"),
            RemediationStep("set-property", "vm-a", "public", "middle", "true"),
        ), outcome.inverse_steps)
        self.assertEqual("true", self.source["vm-a"]["public"])

    def test_inconsistent_forward_chain_rejected_before_generating_inverse(self):
        tampered = replace(self.simulation, changes=(
            ("vm-a", "public", "true", "middle"),
            ("vm-a", "public", "unrelated", "false")))
        outcome = self.plan(simulation=tampered)
        self.assertEqual("rejected", outcome.status)
        self.assertEqual(("inconsistent_change_chain",), outcome.reasons)
        self.assertIsNone(outcome.document)
        self.assertEqual((), outcome.inverse_steps)

    def test_malformed_forward_change_rejected(self):
        for changes in (
            (("vm-a", "public", "true", "true"),),
            (("vm-a", "public", "true", 5),),
            (("vm-a", "public", "true"),),
            ((None, "public", "true", "false"),),
        ):
            with self.subTest(changes=changes):
                outcome = self.plan(simulation=replace(self.simulation, changes=changes))
                self.assertEqual(("invalid_change",), outcome.reasons)
                self.assertIsNone(outcome.document)
                self.assertEqual((), outcome.inverse_steps)

    def test_foreign_tenant_rejected(self):
        self.assertEqual("rejected", self.plan(decision=replace(
            self.decision, tenant_id="tenant-b")).status)

    def test_failed_dry_run_rejected(self):
        self.assertEqual("rejected", self.plan(simulation=replace(
            self.simulation, status="rejected")).status)

    def test_missing_evidence_rejected(self):
        self.assertEqual("rejected", self.plan(evidence_refs=[]).status)

    def test_missing_simulation_decision_rejected(self):
        self.assertEqual("rejected", self.plan(simulation=replace(
            self.simulation, decision_id=None)).status)

    def test_no_changes_rejected(self):
        self.assertEqual("rejected", self.plan(simulation=replace(
            self.simulation, changes=())).status)


if __name__ == "__main__":
    unittest.main()
