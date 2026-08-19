"""TB-252 / TB-253 marketability drift guards (Batch 5CC)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestMarketabilityBatch5CC(unittest.TestCase):
    def test_tb_252_raster_assets_and_generator(self) -> None:
        logo = REPO_ROOT / "archlucid-ui" / "public" / "logo"
        self.assertTrue((logo / "og-default.png").is_file())
        self.assertTrue((logo / "icon-192.png").is_file())
        self.assertTrue((logo / "icon-512.png").is_file())
        script = REPO_ROOT / "archlucid-ui" / "scripts" / "generate-brand-raster.mjs"
        self.assertTrue(script.is_file())
        pkg = (REPO_ROOT / "archlucid-ui" / "package.json").read_text(encoding="utf-8")
        self.assertIn("generate:brand-raster", pkg)

    def test_tb_253_marketing_open_graph_helper(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "marketing-open-graph.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Defensible architecture, on demand", text)
        self.assertIn("buildMarketingSocialMetadata", text)

    def test_tb_253_layout_uses_buyer_copy(self) -> None:
        layout = (REPO_ROOT / "archlucid-ui" / "src" / "app" / "layout.tsx").read_text(encoding="utf-8")
        self.assertIn("MARKETING_ROOT_OG_DESCRIPTION", layout)
        self.assertNotIn("Operator UI for architecture runs", layout)


if __name__ == "__main__":
    unittest.main()
