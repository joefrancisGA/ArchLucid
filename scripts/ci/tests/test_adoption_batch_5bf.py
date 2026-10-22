"""TB-232 LinkedIn publishing calendar drift guards (Batch 5BF)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BF(unittest.TestCase):
    def test_tb_232_linkedin_schedule(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "LINKEDIN_CONTENT_V1.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("## Publishing schedule (M-10–M-15)", text)
        self.assertIn("M-10", text)
        self.assertIn("M-15", text)
        self.assertIn("Comment seed", text)


if __name__ == "__main__":
    unittest.main()
