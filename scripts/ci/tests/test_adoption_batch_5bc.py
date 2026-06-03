"""TB-229 reference-customer workflow drift guards (Batch 5BC)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BC(unittest.TestCase):
    def test_tb_229_first_contact_template(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "REFERENCE_CUSTOMER_FIRST_CONTACT_TEMPLATE.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("<<PILOT_OUTCOME_SENTENCE>>", text)
        self.assertIn("15%", text)

    def test_tb_229_tracking_checklist(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "REFERENCE_CUSTOMER_TRACKING_CHECKLIST.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Published", text)

    def test_tb_229_readme_link(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "reference-customers" / "README.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("REFERENCE_CUSTOMER_FIRST_CONTACT_TEMPLATE.md", text)
        self.assertIn("REFERENCE_CUSTOMER_TRACKING_CHECKLIST.md", text)


if __name__ == "__main__":
    unittest.main()
