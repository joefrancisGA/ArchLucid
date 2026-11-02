"""Unit tests for scripts/ci/check_securenow_roi_notes.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_roi_notes import ROOT, validate


def _copy_tree(destination: Path) -> None:
    for relative in (
        "docs/securenow/PILOT_MEASUREMENT_LOG.md",
        "docs/securenow/ROI_COST_INPUT.md",
        "docs/securenow/ROI_FIXTURE_WORKSHEET.md",
        "docs/securenow/ROI_SEND_RULE.md",
        "docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md",
        "archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts",
        "archlucid-ui/src/lib/product-line/securenow-investigation-effort-copy.ts",
        "archlucid-ui/src/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx",
    ):
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowRoiNotesTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_dollar_in_cost_card_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/ROI_COST_INPUT.md"
            path.write_text(path.read_text(encoding="utf-8") + "\n$100\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_removed_roi_not_calculated_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md"
            path.write_text(
                path.read_text(encoding="utf-8").replace("ROI not calculated", "ROI calculated"),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("ROI not calculated" in error for error in errors))

    def test_dollar_in_send_rule_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/ROI_SEND_RULE.md"
            path.write_text(path.read_text(encoding="utf-8") + "\nFee: $100.\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("send rule: contains '$'" in error for error in errors))

    def test_missing_measurement_sample_size_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/PILOT_MEASUREMENT_LOG.md"
            path.write_text(path.read_text(encoding="utf-8").replace("Sample size", "Sample count"), encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("Sample size" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
