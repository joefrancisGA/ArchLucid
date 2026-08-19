"""TB-254 marketability drift guards (Batch 5CF)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestMarketabilityBatch5CF(unittest.TestCase):
    def test_tb_254_marketing_faq_and_json_ld(self) -> None:
        faq_lib = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "marketing-faq.ts"
        faq_ld = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "marketing-faq-json-ld.ts"
        faq_page = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(marketing)" / "faq" / "page.tsx"

        faq_lib_text = faq_lib.read_text(encoding="utf-8")
        self.assertIn("MARKETING_FAQ_ITEMS", faq_lib_text)
        self.assertGreaterEqual(faq_lib_text.count("question:"), 8)

        faq_ld_text = faq_ld.read_text(encoding="utf-8")
        self.assertIn("buildFaqPageLd", faq_ld_text)
        self.assertIn("FAQPage", faq_ld_text)

        faq_page_text = faq_page.read_text(encoding="utf-8")
        self.assertIn("MarketingFaqPageClient", faq_page_text)
        self.assertIn("application/ld+json", faq_page_text)

        faq_client = REPO_ROOT / "archlucid-ui" / "src" / "components" / "marketing" / "MarketingFaqPageClient.tsx"
        faq_client_text = faq_client.read_text(encoding="utf-8")
        self.assertIn("MARKETING_FAQ_ITEMS", faq_client_text)


if __name__ == "__main__":
    unittest.main()
