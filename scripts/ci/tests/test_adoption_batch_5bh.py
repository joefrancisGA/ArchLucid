"""TB-234 SHOULD_YOU_EVALUATE ICP enrichment drift guards (Batch 5BH)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BH(unittest.TestCase):
    def test_tb_234_q5_and_strong_fit(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "BUYER_PERSONAS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("**Q5.**", text)
        self.assertIn("at least 3 architects", text)
        self.assertIn("Strong fit signals", text)
        self.assertIn("architecture review board", text)

    def test_tb_234_evaluation_path(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "BUYER_PERSONAS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("archlucid.net/trial", text)
        self.assertIn("archlucid doctor", text)
        self.assertIn("archlucid new --quick-scan", text)


if __name__ == "__main__":
    unittest.main()
