"""Unit tests for scripts/ci/check_securenow_stickiness.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_stickiness import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/RETURN_REASONS.md",
    "archlucid-ui/src/lib/product-line/securenow-return-home-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-return-reasons-copy.ts",
    "archlucid-ui/src/app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView.tsx",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowStickinessTests(unittest.TestCase):
    def test_real_repo_passes(self) -> None:
        self.assertEqual([], validate())

    def test_dollar_amount_in_return_note_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/RETURN_REASONS.md"
            path.write_text(path.read_text(encoding="utf-8") + "\n$5000.\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_missing_diagrams_destination_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/lib/product-line/securenow-return-home-copy.ts"
            text = path.read_text(encoding="utf-8").replace("/infrastructure/diagrams", "/infrastructure/removed")
            path.write_text(text, encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("/infrastructure/diagrams" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
