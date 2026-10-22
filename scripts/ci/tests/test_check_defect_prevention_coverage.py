from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "scripts" / "ci"))

from check_defect_prevention_coverage import validate


class DefectPreventionCoverageTests(unittest.TestCase):
    def test_repository_matrix_has_twenty_valid_rows(self) -> None:
        matrix = ROOT / "docs" / "engineering" / "DEFECT_PREVENTION_COVERAGE.md"
        self.assertEqual(validate(matrix.read_text(encoding="utf-8")), [])

    def test_partial_rows_require_remaining_work(self) -> None:
        text = "| A | Partial | existing check |  |\n"
        self.assertIn("missing remaining work for A", validate(text))

    def test_duplicate_items_are_rejected(self) -> None:
        text = "\n".join(
            [
                "| A | Enforced | check | done |",
                "| A | Enforced | check | done |",
            ]
        )
        self.assertTrue(any("duplicate coverage item" in error for error in validate(text)))
