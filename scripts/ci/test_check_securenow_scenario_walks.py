"""Unit tests for scripts/ci/check_securenow_scenario_walks.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_scenario_walks import ROOT, validate

TRACKED_PATHS = (
    "archlucid-ui/src/lib/product-line/securenow-scenario-walks-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-scenario-home-copy.ts",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowScenarioWalkTests(unittest.TestCase):
    def test_real_repo_passes(self):
        self.assertEqual([], validate())

    def test_dollar_in_operator_copy_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / TRACKED_PATHS[0]
            path.write_text(path.read_text(encoding="utf-8") + "\nconst fee = '$100';\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_missing_home_route_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / TRACKED_PATHS[1]
            path.write_text(
                path.read_text(encoding="utf-8").replace(
                    "/administration/securenow-scenario-walks",
                    "/administration/removed",
                ),
                encoding="utf-8",
            )
            errors = validate(root)
            self.assertTrue(any("scenario-walks route" in error for error in errors))

    def test_later_capture_success_claim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / TRACKED_PATHS[0]
            text = path.read_text(encoding="utf-8").replace(
                "NOT VERIFIED",
                "verified clean; remediation succeeded",
            )
            path.write_text(text, encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("verified clean" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
