"""TB-223 decisions-needed surface linkage drift guards (Batch 5AR)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AR(unittest.TestCase):
    def test_tb_223_waivers_tile_links_risk_exceptions(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "DecisionsNeededSummaryCard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/governance/exceptions", text)

    def test_tb_223_dashboard_still_wires_summary(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "ExecutiveWorkspaceHealthDashboard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("DecisionsNeededSummaryCard", text)
        self.assertIn("useGovernanceDecisionsNeededSummaryQuery", text)


if __name__ == "__main__":
    unittest.main()
