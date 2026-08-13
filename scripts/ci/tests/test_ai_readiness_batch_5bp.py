"""TB-185 per-finding Ask drift guards (Batch 5BP)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BP(unittest.TestCase):
    def test_tb_185_finding_ask_service(self) -> None:
        path = REPO_ROOT / "ArchLucid.Host.Core" / "Services" / "Ask" / "AskService.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AskAboutFindingAsync", text)

    def test_tb_185_finding_ask_api_route(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "api" / "finding-ask-api.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("architecture/finding", text)
        self.assertIn("/ask", text)

    def test_tb_185_inline_ask_panel(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "findings" / "FindingAskInlinePanel.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("finding-ask-inline-panel", text)

    def test_tb_185_quick_decision_chat_icon(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "quick-decision-summary" / "QuickDecisionSummaryFindingRow.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("MessageCircle", text)
        self.assertIn("FindingAskInlinePanel", text)


if __name__ == "__main__":
    unittest.main()
