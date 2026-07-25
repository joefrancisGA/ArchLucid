"""TB-233 demo video storyboard drift guards (Batch 5BG)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BG(unittest.TestCase):
    def test_tb_233_storyboard(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "DEMO_VIDEO_SCRIPT.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("3 minutes", text)
        self.assertIn("| Segment |", text)
        self.assertIn("Pre-production checklist", text)
        self.assertIn("Post-production checklist", text)

    def test_tb_233_datasheet_and_brief_links(self) -> None:
        datasheet = (REPO_ROOT / "docs" / "go-to-market" / "PRODUCT_DATASHEET.md").read_text(encoding="utf-8")
        brief = (REPO_ROOT / "docs" / "go-to-market" / "EXECUTIVE_SPONSOR_BRIEF.md").read_text(encoding="utf-8")
        self.assertIn("DEMO_VIDEO_SCRIPT.md", datasheet)
        self.assertIn("DEMO_VIDEO_SCRIPT.md", brief)


if __name__ == "__main__":
    unittest.main()
