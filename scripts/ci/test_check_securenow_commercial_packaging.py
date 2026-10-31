"""Unit tests for scripts/ci/check_securenow_commercial_packaging.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_commercial_packaging import ROOT, validate


def _copy_tree(destination: Path) -> None:
    for relative in (
        "docs/securenow/ORDER_FORM_TEMPLATE.md",
        "docs/securenow/QUOTE_TO_PILOT_CHECKLIST.md",
        "docs/securenow/SKU_METER_CARD.md",
    ):
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowCommercialPackagingTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_fee_literal_in_order_form_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/ORDER_FORM_TEMPLATE.md"
            path.write_text(path.read_text(encoding="utf-8") + "\n$100\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_missing_no_go_in_checklist_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/QUOTE_TO_PILOT_CHECKLIST.md"
            path.write_text(
                path.read_text(encoding="utf-8").replace("NO_GO", "OWNER_REVIEW"),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("missing NO_GO" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
