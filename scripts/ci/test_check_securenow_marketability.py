"""Unit tests for scripts/ci/check_securenow_marketability.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_marketability import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/BUYER_OVERVIEW.md",
    "docs/securenow/FIXTURE_STORYBOARD.md",
    "archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts",
    "archlucid-ui/src/app/(marketing)/why-securenow/page.tsx",
    "archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts",
    "archlucid-ui/src/app/(marketing)/layout.tsx",
    "archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx",
    "archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowMarketabilityTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_dollar_in_overview_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/BUYER_OVERVIEW.md"
            path.write_text(path.read_text(encoding="utf-8") + "\n$100\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_marketing_menu_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx"
            path.write_text(
                path.read_text(encoding="utf-8") + '\n<a href="/why-securenow">Draft</a>\n',
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any('href="/why-securenow"' in error for error in errors))


if __name__ == "__main__":
    unittest.main()
