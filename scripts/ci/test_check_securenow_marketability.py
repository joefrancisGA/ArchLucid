"""Unit tests for scripts/ci/check_securenow_marketability.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_marketability import ROOT, STATUS_LINE, validate

TRACKED_PATHS = (
    "docs/securenow/BUYER_OVERVIEW.md",
    "docs/securenow/FIXTURE_STORYBOARD.md",
    "archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts",
    "archlucid-ui/src/lib/marketing/securenow-sample-copy.ts",
    "archlucid-ui/src/app/(marketing)/why-securenow/page.tsx",
    "archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx",
    "archlucid-ui/src/app/(marketing)/securenow-sample/page.tsx",
    "archlucid-ui/src/app/(marketing)/securenow-sample/SecureNowSampleView.tsx",
    "archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts",
    "archlucid-ui/src/app/(marketing)/layout.tsx",
    "archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx",
    "archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts",
    "archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx",
    "archlucid-ui/src/components/marketing/MarketingPublicFooter.tsx",
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

    def test_missing_status_line_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts"
            path.write_text(path.read_text(encoding="utf-8").replace(STATUS_LINE, ""), encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("missing public status line" in error for error in errors))

    def test_missing_menu_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx"
            path.write_text(
                path.read_text(encoding="utf-8").replace('href="/why-securenow"', ""),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any('missing href="/why-securenow"' in error for error in errors))

    def test_missing_public_page_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx"
            path.write_text(
                path.read_text(encoding="utf-8").replace('href="/securenow-sample"', ""),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any('missing href="/securenow-sample"' in error for error in errors))

    def test_missing_fixture_beat_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/lib/marketing/securenow-sample-copy.ts"
            path.write_text(
                path.read_text(encoding="utf-8").replace('title: "Audit link"', ""),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("missing beat 'Audit link'" in error for error in errors))

    def test_welcome_public_secure_now_link_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx"
            path.write_text(
                path.read_text(encoding="utf-8") + '\nconst heldLink = "/why-securenow";\n',
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("welcome/footer must not contain" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
