"""TB-226 risk exceptions management page drift guards (Batch 5AS)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AS(unittest.TestCase):
    def test_tb_226_risk_exceptions_page(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "governance" / "exceptions" / "page.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("RiskExceptionsClient", text)

    def test_tb_226_client_lists_and_actions(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "RiskExceptionsClient.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("listRiskExceptions", text)
        self.assertIn("renewRiskException", text)
        self.assertIn("revokeRiskException", text)
        self.assertIn("risk-exceptions-expiring-warning", text)

    def test_tb_226_nav_after_findings(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "operate-governance-nav-group-builder.ts"
        text = path.read_text(encoding="utf-8")
        findings_index = text.index("/governance/findings")
        risk_index = text.index("/governance/exceptions")
        self.assertGreater(risk_index, findings_index)

    def test_tb_226_vitest(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "governance" / "RiskExceptionsClient.test.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("risk-exceptions-expiring-warning", text)


if __name__ == "__main__":
    unittest.main()
