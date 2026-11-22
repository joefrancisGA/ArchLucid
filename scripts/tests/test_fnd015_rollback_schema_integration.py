import json
import unittest
from pathlib import Path
from uuid import uuid4

from jsonschema import Draft202012Validator, FormatChecker

from scripts.integration.fnd014_isolated_dry_run import (
    DryRunAuthorization, RemediationStep, simulate_remediation,
)
from scripts.integration.fnd015_rollback_planner import (
    RollbackPlanningDecision, plan_rollout_and_rollback,
)


class RollbackPlannerSchemaIntegrationTests(unittest.TestCase):
    def test_generated_document_matches_fnd015_schema(self):
        tenant = str(uuid4())
        source = {"resource-1": {"exposed": "true"}}
        dry_run = simulate_remediation(
            source,
            [RemediationStep("set-property", "resource-1", "exposed", "true", "false")],
            principal_id="operator", tenant_id=tenant, project_id="project-1",
            proposal_id="proposal-1",
            decision=DryRunAuthorization("operator", tenant, "project-1",
                                         "proposal-1", "remediation.simulate", True, "decision-1"),
        )
        result = plan_rollout_and_rollback(
            dry_run, tenant_id=tenant, proposal_id="proposal-1",
            evidence_refs=["evidence-1"], deployment_policy_ref="policy-1",
            decision=RollbackPlanningDecision(True, "remediation.plan", tenant,
                                               "proposal-1", "decision-2"),
        )
        self.assertEqual("planned", result.status)
        schema_path = (Path(__file__).resolve().parents[2]
                       / "schemas/operations/rollout-rollback/1.0.0.schema.json")
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        errors = sorted(validator.iter_errors(result.document), key=lambda e: list(map(str, e.path)))
        self.assertEqual([], [error.message for error in errors])


if __name__ == "__main__":
    unittest.main()
