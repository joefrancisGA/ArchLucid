"""Unit tests for scripts/ci/check_securenow_adoption_friction.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_adoption_friction import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/FIRST_HOUR.md",
    "archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts",
    "archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx",
    "archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx",
    "archlucid-ui/src/lib/product-line/product-line-catalog.ts",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowAdoptionFrictionTests(unittest.TestCase):
    def test_real_repo_passes(self) -> None:
        self.assertEqual([], validate())

    def test_dollar_amount_in_first_hour_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/FIRST_HOUR.md"
            path.write_text(path.read_text(encoding="utf-8") + "\nFee: $5000.\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_missing_start_here_on_home_copy_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts"
            text = path.read_text(encoding="utf-8").replace("Start here", "Begin")
            path.write_text(text, encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("Start here" in error for error in errors))

    def test_missing_path_inspect_in_first_hour_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/FIRST_HOUR.md"
            path.write_text(path.read_text(encoding="utf-8").replace("Path inspect", "Panel"), encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("Path inspect" in error for error in errors))

    def test_missing_collection_link_on_environment_context_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx"
            path.write_text(path.read_text(encoding="utf-8").replace("No collection yet", "Collection unavailable"), encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("No collection yet" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
