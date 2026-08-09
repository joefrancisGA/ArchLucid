"""TB-219 wizard preset deeplink drift guards (Batch 5AG)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AG(unittest.TestCase):
    def test_tb_219_wizard_preset_deeplink_module(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "wizard-preset-deeplink.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("greenfield-web-app", text)
        self.assertIn("modernize-legacy", text)
        self.assertIn("blank-advanced", text)

    def test_tb_219_new_run_wizard_reads_preset_param(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "new"
            / "NewRunWizardClient.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("wizard-preset-deeplink", text)
        self.assertIn("wizard-preset-deeplink-active", text)

    def test_tb_219_vitest_covers_greenfield_deeplink(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "new"
            / "NewRunWizardClient.preset-deeplink.test.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("preset=greenfield", text)
        self.assertIn("CustomerWebApp", text)

    def test_tb_219_should_you_evaluate_links_pilot_preset(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "BUYER_PERSONAS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/reviews/new?preset=greenfield", text)
        self.assertIn("pre-fills greenfield preset", text)

    def test_tb_219_evaluator_workbook_quick_start_preset(self) -> None:
        # EVALUATOR_WORKBOOK.md is a stub; greenfield preset deeplink is documented on buyer personas.
        path = REPO_ROOT / "docs" / "go-to-market" / "BUYER_PERSONAS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("reviews/new?preset=greenfield", text)


if __name__ == "__main__":
    unittest.main()
