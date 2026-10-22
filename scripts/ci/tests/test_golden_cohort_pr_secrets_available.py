"""Tests for scripts/ci/golden_cohort_pr_secrets_available.sh."""

from __future__ import annotations

import os
import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "golden_cohort_pr_secrets_available.sh"

_SAME_REPO = "joefrancisGA/ArchLucid"
_FORK_REPO = "someone/ArchLucid"
_OIDC = {
    "AZURE_CLIENT_ID": "11111111-1111-1111-1111-111111111111",
    "AZURE_TENANT_ID": "22222222-2222-2222-2222-222222222222",
    "AZURE_SUBSCRIPTION_ID": "33333333-3333-3333-3333-333333333333",
}


def _run(**env: str) -> subprocess.CompletedProcess[str]:
    merged = {
        "PATH": os.environ.get("PATH", ""),
        "HOME": os.environ.get("HOME", ""),
        "GITHUB_ACTOR": "human",
        "GITHUB_EVENT_NAME": "schedule",
        "GITHUB_REPOSITORY": _SAME_REPO,
        "PR_HEAD_REPO_FULL_NAME": "",
        "AZURE_CLIENT_ID": "",
        "AZURE_TENANT_ID": "",
        "AZURE_SUBSCRIPTION_ID": "",
    }
    merged.update(env)

    return subprocess.run(
        ["bash", str(SCRIPT)],
        cwd=REPO_ROOT,
        env=merged,
        capture_output=True,
        text=True,
        check=False,
    )


class GoldenCohortPrSecretsAvailableTests(unittest.TestCase):
    def test_script_exists(self) -> None:
        self.assertTrue(SCRIPT.is_file(), f"Expected eligibility helper at {SCRIPT}")

    def test_dependabot_actor_noops_even_when_oidc_env_is_populated(self) -> None:
        result = _run(
            GITHUB_ACTOR="dependabot[bot]",
            GITHUB_EVENT_NAME="pull_request",
            PR_HEAD_REPO_FULL_NAME=_SAME_REPO,
            **_OIDC,
        )

        self.assertEqual(result.returncode, 1)
        self.assertIn("Dependabot pull request", result.stdout)
        self.assertIn("secrets unavailable", result.stdout)

    def test_fork_pull_request_noops(self) -> None:
        result = _run(
            GITHUB_EVENT_NAME="pull_request",
            PR_HEAD_REPO_FULL_NAME=_FORK_REPO,
            **_OIDC,
        )

        self.assertEqual(result.returncode, 1)
        self.assertIn("Fork pull request", result.stdout)
        self.assertIn("secrets unavailable", result.stdout)

    def test_same_repo_pull_request_with_empty_oidc_noops(self) -> None:
        result = _run(
            GITHUB_EVENT_NAME="pull_request",
            PR_HEAD_REPO_FULL_NAME=_SAME_REPO,
        )

        self.assertEqual(result.returncode, 1)
        self.assertIn("Azure OIDC secrets are empty", result.stdout)
        self.assertIn("Azure credentials unavailable", result.stdout)

    def test_same_repo_pull_request_with_oidc_runs_gate(self) -> None:
        result = _run(
            GITHUB_EVENT_NAME="pull_request",
            PR_HEAD_REPO_FULL_NAME=_SAME_REPO,
            **_OIDC,
        )

        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_schedule_with_empty_oidc_still_attempts_login(self) -> None:
        result = _run(GITHUB_EVENT_NAME="schedule")

        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_schedule_with_oidc_runs_gate(self) -> None:
        result = _run(GITHUB_EVENT_NAME="schedule", **_OIDC)

        self.assertEqual(result.returncode, 0)

    def test_partial_oidc_on_pull_request_noops(self) -> None:
        result = _run(
            GITHUB_EVENT_NAME="pull_request",
            PR_HEAD_REPO_FULL_NAME=_SAME_REPO,
            AZURE_CLIENT_ID=_OIDC["AZURE_CLIENT_ID"],
            AZURE_TENANT_ID=_OIDC["AZURE_TENANT_ID"],
            AZURE_SUBSCRIPTION_ID="",
        )

        self.assertEqual(result.returncode, 1)
        self.assertIn("Azure OIDC secrets are empty", result.stdout)


if __name__ == "__main__":
    unittest.main()
