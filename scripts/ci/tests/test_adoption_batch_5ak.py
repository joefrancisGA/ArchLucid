"""TB-223 decisions-needed KPI card drift guards (Batch 5AK)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AK(unittest.TestCase):
    def test_tb_223_decisions_needed_summary_card_component(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "DecisionsNeededSummaryCard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Decisions needed", text)
        self.assertIn("decisions-needed-summary-card", text)
        self.assertIn("waiversExpiringWithin14Days", text)

    def test_tb_223_executive_dashboard_wires_card(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "ExecutiveWorkspaceHealthDashboard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("DecisionsNeededSummaryCard", text)
        self.assertIn("useGovernanceDecisionsNeededSummaryQuery", text)

    def test_tb_223_api_client_exposes_summary(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "api" / "governance-stickiness-api.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("getGovernanceDecisionsNeededSummary", text)
        self.assertIn("decisions-needed-summary", text)

    def test_tb_223_vitest_covers_summary_card(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "DecisionsNeededSummaryCard.test.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("DecisionsNeededSummaryCard", text)
        self.assertIn("No decisions needed", text)


if __name__ == "__main__":
    unittest.main()
