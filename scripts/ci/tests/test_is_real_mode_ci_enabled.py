"""Tests for scripts/ci/is_real_mode_ci_enabled.sh."""

from __future__ import annotations

import os
import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "is_real_mode_ci_enabled.sh"
MARKER = REPO_ROOT / ".github" / "REAL_MODE_CI_ENABLED"
LIVE_MARKER = REPO_ROOT / ".github" / "REAL_MODE_CI_LIVE_SCHEDULE_ENABLED"


def _run(mode: str, *, env: dict[str, str] | None = None) -> int:
    merged = os.environ.copy()
    if env:
        merged.update(env)

    result = subprocess.run(
        ["bash", str(SCRIPT), mode],
        cwd=REPO_ROOT,
        env=merged,
        capture_output=True,
        text=True,
        check=False,
    )

    return result.returncode


class IsRealModeCiEnabledTests(unittest.TestCase):
    def test_enabled_when_committed_marker_present(self) -> None:
        self.assertTrue(MARKER.is_file())
        self.assertEqual(_run("enabled", env={"ARCHLUCID_GOLDEN_COHORT_REAL_LLM": ""}), 0)

    def test_enabled_when_repository_variable_set(self) -> None:
        self.assertEqual(_run("enabled", env={"ARCHLUCID_GOLDEN_COHORT_REAL_LLM": "true"}), 0)

    def test_live_schedule_honors_explicit_false_override(self) -> None:
        if not LIVE_MARKER.is_file():
            self.skipTest("live schedule marker not committed")

        code = _run(
            "live-schedule",
            env={"ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED": "false"},
        )
        self.assertEqual(code, 1)

    def test_main_ci_live_requires_workflow_dispatch(self) -> None:
        code = _run(
            "main-ci-live",
            env={
                "GITHUB_EVENT_NAME": "pull_request",
                "GITHUB_REPOSITORY": "org/repo",
                "GITHUB_EVENT_PULL_REQUEST_HEAD_REPO_FULL_NAME": "org/repo",
            },
        )
        self.assertEqual(code, 1)

    def test_main_ci_live_on_workflow_dispatch(self) -> None:
        code = _run(
            "main-ci-live",
            env={"GITHUB_EVENT_NAME": "workflow_dispatch"},
        )
        self.assertEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
