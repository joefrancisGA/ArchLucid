"""Unit tests for scripts/ci/check_securenow_decision_velocity.py."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.ci.check_securenow_decision_velocity import ROOT, validate

TRACKED_PATHS = (
    "docs/securenow/PILOT_DECISION_RECORD.md",
    "docs/securenow/DECISION_PATH_ONE_PAGER.md",
    "archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts",
    "archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx",
    "archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-pilot-decision-copy.ts",
    "archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx",
    "docs/securenow/PROCUREMENT_PACK_INDEX.md",
)


def _copy_tree(destination: Path) -> None:
    for relative in TRACKED_PATHS:
        source = ROOT / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


class SecureNowDecisionVelocityTests(unittest.TestCase):
    def test_real_repo_passes(self) -> None:
        self.assertEqual([], validate())

    def test_dollar_amount_in_record_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/PILOT_DECISION_RECORD.md"
            path.write_text(path.read_text(encoding="utf-8") + "\nFee: $5000.\n", encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("contains '$'" in error for error in errors))

    def test_missing_outcome_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _copy_tree(root)
            path = root / "docs/securenow/DECISION_PATH_ONE_PAGER.md"
            text = path.read_text(encoding="utf-8").replace("Proceed to commercial discussion", "Discuss later")
            path.write_text(text, encoding="utf-8")
            errors = validate(root)
            self.assertTrue(any("Proceed to commercial discussion" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
