"""TB-242 ROI model freshness CI guard drift guards (Batch 5AT)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AT(unittest.TestCase):
    def test_tb_242_freshness_script(self) -> None:
        path = REPO_ROOT / "scripts" / "ci" / "check_roi_model_freshness.py"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Last reviewed", text)
        self.assertIn("STALE_AFTER_DAYS", text)

    def test_tb_242_roi_model_date_updated(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "ROI_MODEL.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Last reviewed:** 2026-07-28", text)
        self.assertIn("PRICING_PHILOSOPHY.md", text)

    def test_tb_242_ci_wired(self) -> None:
        path = REPO_ROOT / ".github" / "workflows" / "ci.yml"
        text = path.read_text(encoding="utf-8")
        self.assertIn("check_roi_model_freshness.py", text)

    def test_tb_242_unit_tests(self) -> None:
        path = REPO_ROOT / "scripts" / "ci" / "tests" / "test_check_roi_model_freshness.py"
        text = path.read_text(encoding="utf-8")
        self.assertIn("extract_last_reviewed", text)


if __name__ == "__main__":
    unittest.main()
