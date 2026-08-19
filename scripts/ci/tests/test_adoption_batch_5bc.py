"""TB-229 reference-customer workflow drift guards (Batch 5BC)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BC(unittest.TestCase):
    def test_tb_229_first_contact_template(self) -> None:
        # Canon body lives in README; REFERENCE_PUBLICATION_RUNBOOK.md is a path-stable alias.
        path = (
            REPO_ROOT
            / "docs"
            / "go-to-market"
            / "reference-customers"
            / "README.md"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("<<PILOT_OUTCOME_SENTENCE>>", text)
        self.assertIn("15%", text)
        self.assertIn("First-contact email template", text)
        self.assertIn("{#5-first-contact-email-template}", text)

    def test_tb_229_tracking_checklist(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "reference-customers" / "README.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Per-customer tracking checklist", text)
        self.assertIn("Published", text)

    def test_tb_229_readme_link(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "reference-customers" / "README.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("NAMED_REFERENCE_CUSTOMER_CAPTURE.md", text)
        self.assertIn("REFERENCE_PUBLICATION_RUNBOOK.md", text)
        self.assertIn("per-customer-tracking-checklist", text)


if __name__ == "__main__":
    unittest.main()
