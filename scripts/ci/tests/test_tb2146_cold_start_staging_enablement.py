"""CI drift guard for TB-2146 staging cold-start Phase B + paid-lever reopen gate enablement."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PERFORMANCE_DOC = REPO_ROOT / "docs" / "library" / "PERFORMANCE_COLD_START_AND_TRIMMING.md"
BASELINES_README = REPO_ROOT / "docs" / "operations" / "cold-start-baselines" / "README.md"
STAGING_PENDING = (
    REPO_ROOT / "docs" / "operations" / "cold-start-baselines" / "staging-2026-08-14-tb2146-pending.md"
)
CAPTURE_SCRIPT = REPO_ROOT / "scripts" / "ops" / "capture-cold-start-baseline.ps1"
CHECKLIST = REPO_ROOT / "scripts" / "ops" / "enable-cold-start-staging-baseline-checklist.ps1"
RUNBOOK = REPO_ROOT / "docs" / "runbooks" / "COLD_START_MEASUREMENT.md"


class TestTb2146ColdStartStagingEnablement(unittest.TestCase):
    def test_performance_doc_documents_tb2146_reopen_gate(self) -> None:
        text = PERFORMANCE_DOC.read_text(encoding="utf-8")
        self.assertIn("TB-2146", text)
        self.assertIn("capture-cold-start-baseline.ps1", text)
        self.assertIn("≥ 2.0 s", text)

    def test_baseline_register_has_staging_pending_row(self) -> None:
        readme = BASELINES_README.read_text(encoding="utf-8")
        self.assertIn("TB-2146", readme)
        self.assertIn("staging-2026-08-14-tb2146-pending.md", readme)
        self.assertTrue(STAGING_PENDING.is_file())

    def test_ops_scripts_exist_and_reference_tb2146(self) -> None:
        self.assertTrue(CAPTURE_SCRIPT.is_file())
        self.assertTrue(CHECKLIST.is_file())
        capture = CAPTURE_SCRIPT.read_text(encoding="utf-8")
        checklist = CHECKLIST.read_text(encoding="utf-8")
        self.assertIn("TB-2146", capture)
        self.assertIn("/api/auth/me", capture)
        self.assertIn("TB-2146", checklist)

    def test_runbook_links_capture_script(self) -> None:
        runbook = RUNBOOK.read_text(encoding="utf-8")
        self.assertIn("capture-cold-start-baseline.ps1", runbook)
        self.assertIn("enable-cold-start-staging-baseline-checklist.ps1", runbook)


if __name__ == "__main__":
    unittest.main()
