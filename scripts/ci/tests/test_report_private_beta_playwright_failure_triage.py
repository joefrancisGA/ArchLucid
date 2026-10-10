"""Tests for private-beta Playwright failure triage rollup script.

The push corset runs this file via ``unittest discover``. Bare pytest
functions are invisible to that runner, which exits 5 (NO TESTS RAN).
"""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts/ci/report_private_beta_playwright_failure_triage.py"
    spec = importlib.util.spec_from_file_location(
        "report_private_beta_playwright_failure_triage",
        path,
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load report_private_beta_playwright_failure_triage.py")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ReportPrivateBetaPlaywrightFailureTriageTests(unittest.TestCase):
    def test_build_summary_lists_triage_steps(self) -> None:
        module = _load_module()
        summary = module.build_summary(REPO_ROOT)

        self.assertEqual(summary["overallDisposition"], "PASS")
        self.assertGreaterEqual(summary["stepCount"], 5)
        steps = summary["steps"]
        self.assertIsInstance(steps, list)
        self.assertTrue(any(row["stepId"] == "api-log" for row in steps))

    def test_build_summary_smoke_branch_lane_artifact_names(self) -> None:
        module = _load_module()
        summary = module.build_summary(REPO_ROOT, lane="smoke-branch")
        steps = summary["steps"]
        api_log = next(row for row in steps if row["stepId"] == "api-log")

        self.assertEqual(
            api_log["artifact"],
            "ui-e2e-live-beta-access-smoke-branch-api-log",
        )
        self.assertEqual(summary["lane"], "smoke-branch")

    def test_render_markdown_includes_runbook_path(self) -> None:
        module = _load_module()
        summary = module.build_summary(REPO_ROOT)
        markdown = module.render_markdown(summary)

        self.assertIn("PRIVATE_BETA_TRUNK_SMOKE.md", markdown)
        self.assertIn("live-api-private-beta-access.spec.ts", markdown)
        self.assertIn("live-api-scim-invite-substitute-smoke.spec.ts", markdown)

    def test_classifies_optional_warmup_http_400(self) -> None:
        module = _load_module()
        result = module.classify_warmup_log(
            "Now listening on: http://127.0.0.1:5128\n"
            "Warm create architecture run attempt 1/4 failed (HTTP 400)\n",
        )

        self.assertEqual(result["status"], "EXPECTED_OPTIONAL_HTTP_400")

    def test_marks_retry_failure_for_reliability_review(self) -> None:
        module = _load_module()
        result = module.classify_retry_reliability(
            "retry1 error: branded-not-found assertion failed\n",
        )

        self.assertEqual(result["status"], "RETRY_RELIABILITY_REVIEW")

    def test_main_writes_json_output(self) -> None:
        module = _load_module()

        with tempfile.TemporaryDirectory() as temporary_directory:
            json_out = Path(temporary_directory) / "rollup.json"
            exit_code = module.main(
                [
                    "--lane",
                    "trunk",
                    "--json-out",
                    str(json_out),
                ]
            )

            self.assertEqual(exit_code, 0)
            payload = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(
                payload["stepCount"],
                len(module.build_triage_steps("trunk")),
            )
            self.assertEqual(payload["lane"], "trunk")


if __name__ == "__main__":
    unittest.main()
