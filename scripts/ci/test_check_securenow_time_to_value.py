"""Unit tests for scripts/ci/check_securenow_time_to_value.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_time_to_value import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/FIRST_USEFUL_ANSWER.md",
    "archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx",
    "archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-first-useful-answer-home-copy.ts",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowTimeToValueTests(unittest.TestCase):
    def test_real_repo_passes(self) -> None:
        self.assertEqual([], validate())

    def test_missing_diagrams_path_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts"
            path.write_text(path.read_text(encoding="utf-8").replace("/infrastructure/diagrams", ""), encoding="utf-8")
            self.assertTrue(any("diagrams step href" in error for error in validate(root)))

    def test_minutes_claim_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/FIRST_USEFUL_ANSWER.md"
            path.write_text(path.read_text(encoding="utf-8") + "\nminutes to value\n", encoding="utf-8")
            self.assertTrue(any("forbidden phrase" in error for error in validate(root)))


if __name__ == "__main__":
    unittest.main()
