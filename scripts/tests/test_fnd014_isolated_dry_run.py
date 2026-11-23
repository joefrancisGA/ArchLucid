import copy
import unittest
from dataclasses import replace

from scripts.integration.fnd014_isolated_dry_run import (
    DryRunAuthorization, RemediationStep, simulate_remediation,
)


class DryRunTests(unittest.TestCase):
    def setUp(self):
        self.source = {"resource-a": {"public": "true", "owner": "team"}}
        self.before = copy.deepcopy(self.source)
        self.decision = DryRunAuthorization(
            "alice", "tenant-a", "project-a", "proposal-a",
            "remediation.simulate", True, "decision-a")
        self.steps = [RemediationStep("set-property", "resource-a", "public", "true", "false")]

    def run_plan(self, steps=None, decision=None, source=None):
        return simulate_remediation(
            self.source if source is None else source,
            self.steps if steps is None else steps,
            principal_id="alice", tenant_id="tenant-a", project_id="project-a",
            proposal_id="proposal-a", decision=self.decision if decision is None else decision)

    def test_authorized_simulation_does_not_mutate_source(self):
        result = self.run_plan()
        self.assertEqual("simulated", result.status)
        self.assertNotEqual(result.original_digest, result.simulated_digest)
        self.assertEqual(self.before, self.source)

    def test_denial_is_fail_closed(self):
        result = self.run_plan(decision=replace(self.decision, allowed=False))
        self.assertEqual("rejected", result.status)
        self.assertEqual(self.before, self.source)

    def test_truthy_nonboolean_approvals_never_authorize_simulation(self):
        for untrusted in ("false", "true", 1, 2, None):
            with self.subTest(untrusted=untrusted):
                result = self.run_plan(decision=replace(self.decision, allowed=untrusted))
                self.assertEqual("rejected", result.status)
                self.assertEqual(("not_authorized",), result.reasons)
                self.assertEqual((), result.changes)
                self.assertEqual(self.before, self.source)

    def test_exact_boolean_approval_still_simulates(self):
        self.assertEqual("simulated", self.run_plan(
            decision=replace(self.decision, allowed=True)).status)

    def test_exact_boolean_denial_still_rejects(self):
        self.assertEqual("rejected", self.run_plan(
            decision=replace(self.decision, allowed=False)).status)

    def test_foreign_tenant_denied(self):
        self.assertEqual("rejected", self.run_plan(
            decision=replace(self.decision, tenant_id="tenant-b")).status)

    def test_wrong_proposal_denied(self):
        self.assertEqual("rejected", self.run_plan(
            decision=replace(self.decision, proposal_id="other")).status)

    def test_stale_precondition_rejected_without_partial_changes(self):
        steps = self.steps + [RemediationStep(
            "set-property", "resource-a", "owner", "wrong", "attacker")]
        result = self.run_plan(steps=steps)
        self.assertEqual("rejected", result.status)
        self.assertEqual((), result.changes)
        self.assertEqual(self.before, self.source)

    def test_unknown_operation_rejected(self):
        self.assertEqual("rejected", self.run_plan(steps=[
            RemediationStep("execute-shell", "resource-a", "public", "true", "false")]).status)

    def test_unknown_resource_rejected(self):
        self.assertEqual("rejected", self.run_plan(steps=[
            RemediationStep("set-property", "foreign", "public", "true", "false")]).status)

    def test_step_limit_rejected(self):
        self.assertEqual("rejected", self.run_plan(steps=self.steps * 101).status)

    def test_remove_property_only_in_simulation(self):
        result = self.run_plan(steps=[
            RemediationStep("remove-property", "resource-a", "public", "true", None)])
        self.assertEqual("simulated", result.status)
        self.assertIn("public", self.source["resource-a"])


if __name__ == "__main__":
    unittest.main()
