"""Unit tests for scripts/ci/check_securenow_sponsor_visibility.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_sponsor_visibility import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/SPONSOR_READOUT_OUTLINE.md",
    "docs/securenow/SPONSOR_OUTCOME_SCORECARD_FIXTURE.md",
    "docs/securenow/EXECUTIVE_PACKET_FILL_GUIDE.md",
    "docs/securenow/PROCUREMENT_PACK_INDEX.md",
    "archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowSponsorVisibilityTests(unittest.TestCase):
    def test_real_repo_passes(self) -> None:
        self.assertEqual([], validate())

    def test_dollar_amount_in_scorecard_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/SPONSOR_OUTCOME_SCORECARD_FIXTURE.md"
            path.write_text(path.read_text(encoding="utf-8") + "\n$5000 saved.\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_guaranteed_savings_in_readout_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/SPONSOR_READOUT_OUTLINE.md"
            path.write_text(path.read_text(encoding="utf-8") + "\nGuaranteed savings.\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("guaranteed savings" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
