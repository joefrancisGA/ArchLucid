"""Unit tests for scripts/ci/check_securenow_self_service.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_self_service import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/SELF_SERVICE.md",
    "archlucid-ui/src/lib/product-line/securenow-self-service-home-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-self-service-copy.ts",
    "archlucid-ui/src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.tsx",
    "archlucid-ui/src/lib/product-line/product-line-catalog.ts",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowSelfServiceTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_dollar_in_note_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/SELF_SERVICE.md"
            path.write_text(path.read_text(encoding="utf-8") + "\n$100\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("forbidden phrase '$'" in error for error in errors))

    def test_support_route_must_remain_architecture_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/lib/product-line/product-line-catalog.ts"
            path.write_text(
                path.read_text(encoding="utf-8").replace(
                    '"/administration/support": "architecture"',
                    '"/administration/support": "security"',
                ),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("support route must remain architecture-only" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
