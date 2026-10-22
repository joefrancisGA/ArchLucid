"""TB-223 decisions-needed surface linkage drift guards (Batch 5AR)."""

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


class TestAdoptionBatch5AR(unittest.TestCase):
    def test_tb_223_waivers_tile_links_risk_exceptions(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "DecisionsNeededSummaryCard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/governance/exceptions", text)

    def test_tb_223_dashboard_still_wires_summary(self) -> None:
        text = _sponsor_workspace_health_surface_text()
        self.assertIn("DecisionsNeededSummaryCard", text)
        self.assertIn("useGovernanceDecisionsNeededSummaryQuery", text)


if __name__ == "__main__":
    unittest.main()
