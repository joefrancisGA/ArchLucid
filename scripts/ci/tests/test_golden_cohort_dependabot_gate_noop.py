"""Guard: cohort-real-llm-gate must keep its secretless PR no-op path.

Fork pull requests cannot read repository/environment Azure OIDC secrets. Keep
the eligibility guard in place so the required gate exits cleanly before Azure
login when secrets are unavailable.
"""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "golden-cohort-nightly.yml"


class TestGoldenCohortDependabotGateNoop(unittest.TestCase):
    def test_workflow_keeps_secretless_pr_noop_guard(self) -> None:
        self.assertTrue(
            WORKFLOW.exists(),
            f"Expected golden cohort workflow at {WORKFLOW}",
        )

        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("Gate eligibility (var off, fork PR, or disabled path)", text)
        self.assertIn("github.event.pull_request.head.repo.full_name", text)
        self.assertIn("github.repository", text)
        self.assertIn("Fork pull request;", text)
        self.assertIn("secrets unavailable", text)
        self.assertIn("azure/login@v3", text)
        self.assertIn("client-id: ${{ secrets.AZURE_CLIENT_ID }}", text)
        self.assertIn("if: steps.eligibility.outputs.enabled == 'true'", text)
        self.assertIn("scripts/ci/run_golden_cohort_budget_probe_ci.sh", text)


if __name__ == "__main__":
    unittest.main()
