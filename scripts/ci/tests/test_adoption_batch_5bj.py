"""TB-237 pricing early-adopter framing drift guards (Batch 5BJ)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BJ(unittest.TestCase):
    def test_tb_237_pricing_philosophy_row(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "PRICING_PHILOSOPHY.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Transparent early-access framing", text)
        self.assertIn("early-adopter signal", text)

    def test_tb_237_buyer_copy_constant(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "buyer-copy" / "pricing.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("BUYER_EARLY_ADOPTER_PRICING_NOTE", text)
        self.assertIn("Early adopter pricing", text)
        self.assertIn("50%", text)

    def test_tb_237_pricing_section_testid(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "marketing" / "MarketingPricingEarlyAdopterBanner.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("pricing-early-adopter-framing", text)
        self.assertIn("BUYER_EARLY_ADOPTER_PRICING_NOTE", text)


if __name__ == "__main__":
    unittest.main()
