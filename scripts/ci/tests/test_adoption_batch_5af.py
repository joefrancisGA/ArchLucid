"""TB-218 demo explain conversion CTA drift guards (Batch 5AF)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AF(unittest.TestCase):
    def test_tb_218_conversion_cta_component(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "DemoExplainConversionCtaCard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Ready to run this on your own architecture?", text)
        self.assertIn("preset=greenfield", text)
        self.assertIn("demo-explain-conversion-fab", text)

    def test_tb_218_demo_explain_page_wires_cta(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "demo"
            / "explain"
            / "_sections"
            / "DemoExplainPageView.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("DemoExplainConversionCtaCard", text)

    def test_tb_218_vitest_covers_primary_href(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "DemoExplainConversionCtaCard.test.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("demo-explain-conversion-primary", text)
        self.assertIn("/reviews/new?preset=greenfield", text)

    def test_tb_218_evaluator_workbook_help_slug(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "product-documentation-registry.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn('"evaluator-workbook"', text)
        self.assertIn("path-chooser", text)


if __name__ == "__main__":
    unittest.main()
