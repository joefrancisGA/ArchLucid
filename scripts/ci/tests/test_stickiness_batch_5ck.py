"""TB-260 / TB-263 stickiness + TTV drift guards (Batch 5CK)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestStickinessBatch5CK(unittest.TestCase):
    def test_tb_263_reviews_awaiting_action_endpoint(self) -> None:
        controller = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "GovernanceStickinessController.cs"
        self.assertIn("reviews-awaiting-action", controller.read_text(encoding="utf-8"))

    def test_tb_260_first_value_callout(self) -> None:
        callout = REPO_ROOT / "archlucid-ui" / "src" / "components" / "FirstValueReachedCallout.tsx"
        home = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "_sections" / "OperatorHomePageView.tsx"
        below_fold = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "_sections"
            / "OperatorHomeBelowFoldPanels.tsx"
        )
        self.assertTrue(callout.is_file())
        home_text = home.read_text(encoding="utf-8")
        below_fold_text = below_fold.read_text(encoding="utf-8")
        self.assertTrue(
            "FirstValueReachedCallout" in home_text
            or "OperatorHomeFirstValueCallout" in home_text
            or "OperatorHomeFirstValueCallout" in below_fold_text
            or "showFirstValueCallout" in home_text,
            "Operator home must wire FirstValueReachedCallout (directly or via OperatorHomeFirstValueCallout)",
        )


if __name__ == "__main__":
    unittest.main()
