"""TB-230 GTM placeholder audit drift guards (Batch 5BD)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BD(unittest.TestCase):
    def test_tb_230_product_datasheet_contact_links(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "PRODUCT_DATASHEET.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("archlucid.net/contact", text)
        self.assertNotIn("[placeholder", text)

    def test_tb_230_should_you_evaluate_q2_link(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "BUYER_PERSONAS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("archlucid.net/contact", text)
        self.assertIn("AWS or GCP", text)

    def test_tb_230_placeholder_ci_script(self) -> None:
        script = REPO_ROOT / "scripts" / "ci" / "check_gtm_placeholder_tokens.py"
        self.assertTrue(script.is_file())
        text = script.read_text(encoding="utf-8")
        self.assertIn("TOKEN_PATTERN", text)
        self.assertIn("<<([A-Z][A-Z0-9_]*)>>", text)
        # Human checklist PLACEHOLDER_AUDIT.md was deleted; scanner is the SoT.
        audit = REPO_ROOT / "docs" / "go-to-market" / "PLACEHOLDER_AUDIT.md"
        self.assertFalse(audit.is_file())


if __name__ == "__main__":
    unittest.main()
