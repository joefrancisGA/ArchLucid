"""Unit tests for check_live_api_private_beta_access_ci_wiring.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_live_api_private_beta_access_ci_wiring as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckLiveApiPrivateBetaAccessCiWiring(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_live_api_private_beta_access_ci_wiring.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=result.stdout + result.stderr,
        )

    def test_playwright_timeout_wiring_rejects_legacy_run_cycle_helper(self) -> None:
        errors: list[str] = []

        sut._require_private_beta_playwright_timeout_wiring(
            "test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());",
            f"export function {sut._PRIVATE_BETA_TIMEOUT_FN}() {{ if (process.env.CI) {{ return 2700000; }} }}",
            errors,
        )

        self.assertTrue(any("must not use" in error for error in errors))

    def test_playwright_timeout_wiring_rejects_low_ci_budget(self) -> None:
        errors: list[str] = []

        sut._require_private_beta_playwright_timeout_wiring(
            f"test.setTimeout({sut._PRIVATE_BETA_TIMEOUT_FN}());",
            f"export function {sut._PRIVATE_BETA_TIMEOUT_FN}() {{ if (process.env.CI) {{ return 600000; }} }}",
            errors,
        )

        self.assertTrue(any("below" in error for error in errors))

    def test_push_workflow_requires_failure_triage_rollup(self) -> None:
        push_text = (REPO_ROOT / ".github/workflows/private-beta-access-on-push.yml").read_text(
            encoding="utf-8",
        )
        errors: list[str] = []

        sut._require_private_beta_failure_triage_wiring(
            sut._PUSH_REL,
            push_text,
            sut._PUSH_TRIAGE_ARTIFACT,
            errors,
        )

        self.assertEqual(errors, [])

    def test_ci_workflow_requires_failure_triage_rollup(self) -> None:
        ci_text = (REPO_ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
        errors: list[str] = []

        sut._require_private_beta_failure_triage_wiring(
            sut._CI_REL,
            ci_text,
            sut._CI_TRIAGE_ARTIFACT,
            errors,
        )

        self.assertEqual(errors, [])

    def test_push_workflow_requires_branch_concurrency_cancel(self) -> None:
        push_text = (REPO_ROOT / ".github/workflows/private-beta-access-on-push.yml").read_text(
            encoding="utf-8",
        )
        errors: list[str] = []

        if "private-beta-access-on-push-${{ github.ref }}" not in push_text:
            errors.append("missing branch concurrency group")

        if "cancel-in-progress: true" not in push_text:
            errors.append("missing cancel-in-progress: true")

        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
