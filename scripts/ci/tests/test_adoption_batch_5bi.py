"""TB-235 sponsor one-email kit drift guards (Batch 5BI)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BI(unittest.TestCase):
    def test_tb_235_pilot_closeout_email(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "EXECUTIVE_SPONSOR_BRIEF.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("<<PILOT_OUTCOME>>", text)
        self.assertIn("collect-first-pilot-proof.ps1", text)
        self.assertIn("first-value-report.pdf", text)
        self.assertIn("48 hours", text)
        self.assertIn("5 days", text)

    def test_tb_235_sponsor_brief_cross_ref(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "EXECUTIVE_SPONSOR_BRIEF.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("One-email sponsor / procurement kit", text)
        self.assertIn("POSITIONING.md", text)


if __name__ == "__main__":
    unittest.main()
