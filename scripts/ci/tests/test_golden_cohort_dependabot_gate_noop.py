"""Guard: cohort-real-llm-gate must no-op when Azure secrets are unavailable.

Dependabot PRs cannot read repository/environment Azure OIDC secrets unless those
values are also stored as Dependabot secrets. That left azure/login failing and
blocked merge because cohort-real-llm-gate is a required status check (PR #584).
"""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "golden-cohort-nightly.yml"


class TestGoldenCohortDependabotGateNoop(unittest.TestCase):
    def test_workflow_noops_dependabot_and_empty_azure_oidc(self) -> None:
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn('github.actor }}" = "dependabot[bot]"', text)
        self.assertIn("secrets.AZURE_CLIENT_ID", text)
        self.assertIn("Azure credentials unavailable", text)
        self.assertIn("azure/login@v3", text)
        self.assertIn("scripts/ci/run_golden_cohort_budget_probe_ci.sh", text)


if __name__ == "__main__":
    unittest.main()
