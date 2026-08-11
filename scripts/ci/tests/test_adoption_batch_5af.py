"""TB-218 demo explain conversion CTA drift guards (Batch 5AF)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AF(unittest.TestCase):
    def test_tb_218_conversion_cta_component(self) -> None:
        component = REPO_ROOT / "archlucid-ui" / "src" / "components" / "DemoExplainConversionCtaCard.tsx"
        copy_module = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "demo-explain-page-copy.ts"
        component_text = component.read_text(encoding="utf-8")
        copy_text = copy_module.read_text(encoding="utf-8")
        self.assertIn("Ready to run this on your own architecture?", copy_text)
        self.assertIn("preset=greenfield", copy_text)
        self.assertIn("demo-explain-conversion-fab", component_text)

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
        self.assertIn("DEMO_EXPLAIN_CONVERSION_REVIEW_HREF", text)
        self.assertIn("/architecture/reviews/new?preset=greenfield", (REPO_ROOT / "archlucid-ui" / "src" / "lib" / "demo-explain-page-copy.ts").read_text(encoding="utf-8"))

    def test_tb_218_evaluator_workbook_help_slug(self) -> None:
        registry = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "product-documentation-registry.ts"
        alias = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "ui-route-traffic-evaluator-workbook-help-alias.ts"
        registry_text = registry.read_text(encoding="utf-8")
        alias_text = alias.read_text(encoding="utf-8")
        self.assertIn("path-chooser", registry_text)
        self.assertIn("evaluator-workbook", alias_text)
        self.assertIn("/help/evaluator-workbook", alias_text)


if __name__ == "__main__":
    unittest.main()
