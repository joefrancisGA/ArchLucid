"""TB-223 decisions-needed KPI card drift guards (Batch 5AK)."""

from __future__ import annotations

import unittest
from pathlib import Path

from ci_test_helpers import REPO_ROOT, read_text_union


def _sponsor_workspace_health_surface_text() -> str:
    components = REPO_ROOT / "archlucid-ui" / "src" / "components"
    return read_text_union(
        components / "SponsorWorkspaceHealthDashboard.tsx",
        components / "use-sponsor-workspace-health-dashboard.ts",
    )


class TestAdoptionBatch5AK(unittest.TestCase):
    def test_tb_223_decisions_needed_summary_card_component(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "DecisionsNeededSummaryCard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Decisions needed", text)
        self.assertIn("decisions-needed-summary-card", text)
        self.assertIn("waiversExpiringWithin14Days", text)

    def test_tb_223_sponsor_dashboard_wires_card(self) -> None:
        text = _sponsor_workspace_health_surface_text()
        self.assertIn("DecisionsNeededSummaryCard", text)
        self.assertIn("useGovernanceDecisionsNeededSummaryQuery", text)

    def test_tb_223_api_client_exposes_summary(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "api" / "governance-stickiness-api-registers.ts"
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
