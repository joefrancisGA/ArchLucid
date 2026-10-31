"""Unit tests for scripts/ci/check_securenow_accessibility.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_accessibility import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/ACCESSIBILITY_SCOPE.md",
    "archlucid-ui/src/lib/product-line/securenow-accessibility-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts",
    "archlucid-ui/src/accessibility/securenow-accessibility-axe.test.tsx",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowAccessibilityTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_certification_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/ACCESSIBILITY_SCOPE.md"
            path.write_text(path.read_text(encoding="utf-8") + "\nWCAG certified.\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("WCAG certified" in error for error in errors))

    def test_missing_home_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts"
            text = path.read_text(encoding="utf-8")
            path.write_text(text.replace("/administration/securenow-accessibility", "/administration/removed"), encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("securenow-accessibility" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
