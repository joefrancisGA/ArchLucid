import unittest
from dataclasses import replace

from scripts.integration.fnd014_isolated_dry_run import (
    DryRunAuthorization, RemediationStep, simulate_remediation,
)
from scripts.integration.fnd015_rollback_planner import (
    RollbackPlanningDecision, plan_rollout_and_rollback,
)
from scripts.integration.fnd016_remediation_safety_controller import (
    SafetyFacts, SafetyPolicy, assess_remediation_safety,
)


class SafetyControllerTests(unittest.TestCase):
    def setUp(self):
        self.steps = [RemediationStep("set-property", "r1", "public", "true", "false")]
        source = {"r1": {"public": "true"}}
        self.dry = simulate_remediation(
            source, self.steps, principal_id="user", tenant_id="tenant",
            project_id="project", proposal_id="proposal",
            decision=DryRunAuthorization("user", "tenant", "project",
                "proposal", "remediation.simulate", True, "decision-1"))
        self.rollback = plan_rollout_and_rollback(
            self.dry, tenant_id="tenant", proposal_id="proposal",
            evidence_refs=["evidence-1"], deployment_policy_ref="policy-1",
            decision=RollbackPlanningDecision(
                True, "remediation.plan", "tenant", "proposal", "decision-2"))
        self.facts = SafetyFacts(
            "tenant", "project", "proposal", self.dry.original_digest,
            {"r1": "low"}, {"r1": ()}, frozenset(), False, True)

    def assess(self, **overrides):
        facts = replace(self.facts, **overrides)
        return assess_remediation_safety(
            tenant_id="tenant", project_id="project", proposal_id="proposal",
            steps=self.steps, dry_run=self.dry, rollback=self.rollback, facts=facts)

    def test_valid_plan_requires_independent_recovery_review(self):
        result = self.assess()
        self.assertEqual(result.status, "review_required")
        self.assertFalse(result.eligible_for_execution)

    def test_emergency_stop(self):
        self.assertEqual(self.assess(emergency_stop_active=True).reasons, ("emergency_stop",))

    def test_stale_source(self):
        self.assertEqual(self.assess(current_model_digest="stale").reasons,
                         ("stale_or_unverified_dry_run",))

    def test_critical_resource(self):
        self.assertEqual(self.assess(resource_criticality={"r1": "critical"}).reasons,
                         ("critical_or_unknown_resource",))

    def test_unknown_dependency(self):
        self.assertEqual(self.assess(dependents={"r1": ("shared",)}).reasons,
                         ("unapproved_dependency_impact",))

    def test_untrusted_facts(self):
        self.assertEqual(self.assess(facts_verified=False).reasons,
                         ("untrusted_or_foreign_facts",))

    def test_boolean_like_verification_cannot_pass_review(self):
        for untrusted in ("false", 1, None):
            with self.subTest(untrusted=untrusted):
                result = self.assess(facts_verified=untrusted)
                self.assertEqual(result.status, "rejected")
                self.assertEqual(result.reasons, ("untrusted_or_foreign_facts",))
                self.assertFalse(result.eligible_for_execution)

    def test_only_explicit_false_clears_emergency_stop(self):
        for ambiguous in (None, 0, "", "false", "0"):
            with self.subTest(ambiguous=ambiguous):
                result = self.assess(emergency_stop_active=ambiguous)
                self.assertEqual(result.status, "rejected")
                self.assertEqual(result.reasons, ("emergency_stop_unverified",))
                self.assertFalse(result.eligible_for_execution)

    def test_scope_mismatch(self):
        self.assertEqual(self.assess(tenant_id="other").reasons,
                         ("untrusted_or_foreign_facts",))

    def test_blast_radius(self):
        result = assess_remediation_safety(
            tenant_id="tenant", project_id="project", proposal_id="proposal",
            steps=self.steps, dry_run=self.dry, rollback=self.rollback,
            facts=self.facts, policy=SafetyPolicy(max_changed_resources=0))
        self.assertFalse(result.eligible_for_execution)

    def test_missing_rollback(self):
        result = assess_remediation_safety(
            tenant_id="tenant", project_id="project", proposal_id="proposal",
            steps=self.steps, dry_run=self.dry,
            rollback=replace(self.rollback, status="rejected"), facts=self.facts)
        self.assertEqual(result.reasons, ("rollback_not_planned",))


if __name__ == "__main__":
    unittest.main()
