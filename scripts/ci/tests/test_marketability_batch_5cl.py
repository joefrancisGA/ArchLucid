"""TB-019 / TB-020 marketability drift guards (Batch 5CL)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestMarketabilityBatch5CL(unittest.TestCase):
    def test_tb_019_first_touch_pipeline(self) -> None:
        ui = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "marketing-first-touch.ts"
        api = REPO_ROOT / "ArchLucid.Api" / "Marketing" / "MarketingAttributionHeaderParser.cs"
        svc = REPO_ROOT / "ArchLucid.Application" / "Marketing" / "MarketingAttributionService.cs"
        migration = REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "220_TenantMarketingAttribution.sql"
        self.assertTrue(ui.is_file())
        self.assertTrue(api.is_file())
        self.assertTrue(svc.is_file())
        self.assertTrue(migration.is_file())

    def test_tb_020_marketing_json_ld_and_clarity_kill_switch(self) -> None:
        layout = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(marketing)" / "layout.tsx"
        consent = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "marketing-analytics-consent.ts"
        layout_text = layout.read_text(encoding="utf-8")
        consent_text = consent.read_text(encoding="utf-8")
        self.assertIn("MarketingJsonLd", layout_text)
        self.assertIn("MARKETING_ANALYTICS_DISABLED", consent_text)


if __name__ == "__main__":
    unittest.main()
