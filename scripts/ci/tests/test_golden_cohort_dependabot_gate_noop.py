"""Guard: cohort-real-llm-gate must keep its secretless PR no-op path.

Dependabot and fork pull requests cannot read GitHub Environment Azure OIDC
secrets. Keep the eligibility guard in place so the required gate exits
cleanly before Azure login when secrets are unavailable.
"""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "golden-cohort-nightly.yml"
SECRETS_HELPER = REPO_ROOT / "scripts" / "ci" / "golden_cohort_pr_secrets_available.sh"


class TestGoldenCohortDependabotGateNoop(unittest.TestCase):
    def test_workflow_keeps_secretless_pr_noop_guard(self) -> None:
        self.assertTrue(
            WORKFLOW.exists(),
            f"Expected golden cohort workflow at {WORKFLOW}",
        )
        self.assertTrue(
            SECRETS_HELPER.exists(),
            f"Expected secretless helper at {SECRETS_HELPER}",
        )

        text = WORKFLOW.read_text(encoding="utf-8")
        helper = SECRETS_HELPER.read_text(encoding="utf-8")
        self.assertIn("Gate eligibility (var off, fork PR, Dependabot, or disabled path)", text)
        self.assertIn("scripts/ci/golden_cohort_pr_secrets_available.sh", text)
        self.assertIn("AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}", text)
        self.assertIn("AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}", text)
        self.assertIn("AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}", text)
        self.assertIn('dependabot[bot]', helper)
        self.assertIn("Azure OIDC secrets are empty", helper)
        self.assertIn("Azure credentials unavailable", helper)
        self.assertIn("Fork pull request", helper)
        self.assertIn("secrets unavailable", helper)
        self.assertIn("azure/login@v3", text)
        self.assertIn("client-id: ${{ secrets.AZURE_CLIENT_ID }}", text)
        self.assertIn("if: steps.eligibility.outputs.enabled == 'true'", text)
        self.assertIn("scripts/ci/run_golden_cohort_budget_probe_ci.sh", text)


if __name__ == "__main__":
    unittest.main()
