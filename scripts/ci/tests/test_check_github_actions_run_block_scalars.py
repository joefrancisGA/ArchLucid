"""Unit tests for check_github_actions_run_block_scalars.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import check_github_actions_run_block_scalars as sut

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCheckGithubActionsRunBlockScalars(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_github_actions_run_block_scalars.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertIn("check_github_actions_run_block_scalars: OK", result.stdout)

    def test_find_folded_run_steps_rejects_playwright_install_joined_with_test(self) -> None:
        text = (
            "        run:\n"
            "          npx playwright install --with-deps chromium\n"
            "          npx playwright test\n"
        )

        self.assertEqual(sut.find_folded_run_steps(text), [1])

    def test_find_folded_run_steps_accepts_block_scalar(self) -> None:
        text = (
            "        run: |\n"
            "          npx playwright install --with-deps chromium\n"
            "          npx playwright test\n"
        )

        self.assertEqual(sut.find_folded_run_steps(text), [])

    def test_find_folded_run_steps_accepts_single_line_run(self) -> None:
        text = "        run: npx playwright install --with-deps chromium\n"

        self.assertEqual(sut.find_folded_run_steps(text), [])

    def test_scan_workflow_dir_reports_relative_path_and_line(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workflows = Path(tmp) / "workflows"
            workflows.mkdir()
            (workflows / "live-e2e-nightly.yml").write_text(
                "      - name: Playwright full live suite (ApiKey)\n"
                "        run:\n"
                "          npx playwright install --with-deps chromium\n"
                "          npx playwright test\n",
                encoding="utf-8",
            )

            errors = sut.scan_workflow_dir(workflows)

            self.assertEqual(len(errors), 1)
            self.assertIn("live-e2e-nightly.yml:2:", errors[0])
            self.assertIn("block scalar", errors[0])

    def test_scan_workflow_dir_accepts_literal_block(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workflows = Path(tmp) / "workflows"
            workflows.mkdir()
            (workflows / "ok.yml").write_text(
                "        run: |\n"
                "          npx playwright install --with-deps chromium\n"
                "          npx playwright test\n",
                encoding="utf-8",
            )

            self.assertEqual(sut.scan_workflow_dir(workflows), [])


if __name__ == "__main__":
    unittest.main()
