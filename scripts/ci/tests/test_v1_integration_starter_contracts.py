"""Tests for V1 integration starter contract fixtures."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CI = ROOT / "scripts" / "ci"


def run_py(script: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(CI / script), *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class V1IntegrationStarterContractsTests(unittest.TestCase):
    def test_fixtures_validate_against_openapi(self) -> None:
        result = run_py("check_v1_integration_starter_contracts.py")

        self.assertEqual(0, result.returncode, msg=result.stderr or result.stdout)

    def test_workflow_count_and_core_paths(self) -> None:
        import json

        path = CI / "data" / "v1_integration_starter_contracts.v1.json"
        payload = json.loads(path.read_text(encoding="utf-8"))
        workflows = payload["workflows"]
        workflow_ids = {row["id"] for row in workflows}

        self.assertEqual(
            {
                "review-lifecycle",
                "artifacts-retrieval",
                "compare-runs",
                "pre-commit-governance-gate",
                "roi-summary",
            },
            workflow_ids,
        )

        review_steps = next(row for row in workflows if row["id"] == "review-lifecycle")["steps"]
        paths = {step["path"] for step in review_steps}

        self.assertIn("/v1/architecture/request", paths)
        self.assertIn("/v1/architecture/review/{runId}/finalize", paths)

        pre_commit_steps = next(row for row in workflows if row["id"] == "pre-commit-governance-gate")["steps"]
        pre_commit_paths = {step["path"] for step in pre_commit_steps}

        self.assertIn("/v1/governance/pre-finalize/simulate", pre_commit_paths)

    def test_pre_commit_ci_gate_starter_assets_exist(self) -> None:
        root = ROOT
        for relative in (
            "docs/runbooks/CI_GOVERNANCE_GATE.md",
            "scripts/ci/data/pre_commit_ci_gate_starter.github-actions.yml",
            "scripts/ci/data/pre_commit_ci_gate_starter.azure-pipelines-snippet.yml",
        ):
            self.assertTrue((root / relative).is_file(), msg=f"missing {relative}")


if __name__ == "__main__":
    unittest.main()
