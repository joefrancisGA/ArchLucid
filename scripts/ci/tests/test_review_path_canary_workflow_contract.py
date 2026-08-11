"""TB-959 — review-path canary workflow contract anchors."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "review-path-canary.yml"
RUNBOOK = REPO_ROOT / "docs" / "runbooks" / "REVIEW_PATH_CANARY.md"
PAGE_SCRIPT = REPO_ROOT / "scripts" / "ops" / "page-critical-canary-failure.sh"
SMOKE_SCRIPT = REPO_ROOT / "scripts" / "staging-smoke.ps1"


class ReviewPathCanaryWorkflowContractTests(unittest.TestCase):
    def test_workflow_exists_with_tb959_gates_and_paging(self) -> None:
        text = WORKFLOW.read_text(encoding="utf-8")

        self.assertIn("TB-959", text)
        self.assertIn("ARCHLUCID_REVIEW_PATH_CANARY_ENABLED", text)
        self.assertIn("ARCHLUCID_REVIEW_PATH_CANARY_KILL_SWITCH", text)
        self.assertIn("staging-smoke.ps1", text)
        self.assertIn("page-critical-canary-failure.sh", text)
        self.assertIn("ARCHLUCID_PAGERDUTY_ROUTING_KEY", text)

    def test_runbook_and_scripts_exist(self) -> None:
        self.assertTrue(RUNBOOK.is_file(), "REVIEW_PATH_CANARY.md runbook missing")
        self.assertTrue(PAGE_SCRIPT.is_file(), "page-critical-canary-failure.sh missing")
        self.assertTrue(SMOKE_SCRIPT.is_file(), "staging-smoke.ps1 missing")


if __name__ == "__main__":
    unittest.main()
