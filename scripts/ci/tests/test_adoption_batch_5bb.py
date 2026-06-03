"""TB-249 portfolio 403 drift guards (Batch 5BB)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BB(unittest.TestCase):
    def test_tb_249_api_problem(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Roi" / "RoiController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Portfolio directory key not configured", text)
        self.assertIn("portfolio-key-not-configured", text)

    def test_tb_249_ui_card(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "portfolio" / "_sections" / "PortfolioPageView.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("portfolio-directory-key-not-configured", text)
        self.assertIn("tryParseApiProblemDetails", text)

    def test_tb_249_doc(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "MULTI_TENANT_PORTFOLIO.md"
        self.assertTrue(path.is_file())


if __name__ == "__main__":
    unittest.main()
