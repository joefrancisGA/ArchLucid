"""TB-057 architecture risk register drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestStickinessBatchTb057(unittest.TestCase):
    def test_tb_057_architecture_risk_register_framing(self) -> None:
        client = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "governance"
            / "findings"
            / "GovernanceFindingsQueueClient.tsx"
        )
        findings_query = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "components"
            / "governance"
            / "findings"
            / "governance-findings-query-fetch.ts"
        )
        page_constants = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "lib"
            / "architecture"
            / "architecture-risk-register-page.ts"
        )
        csv_module = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "lib"
            / "architecture"
            / "architecture-risk-register-csv.ts"
        )
        reader = REPO_ROOT / "ArchLucid.Persistence" / "Governance" / "ArchitectureRiskRegisterReader.cs"
        i18n = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "i18n.ts"

        client_text = client.read_text(encoding="utf-8")
        findings_query_text = findings_query.read_text(encoding="utf-8")
        page_constants_text = page_constants.read_text(encoding="utf-8")
        i18n_text = i18n.read_text(encoding="utf-8")
        self.assertIn("ARCHITECTURE_RISK_REGISTER_PAGE_TITLE", client_text)
        self.assertIn(
            "ARCHITECTURE_RISK_REGISTER_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.findings",
            page_constants_text,
        )
        # Nav/menu label is Findings (owner rename); TB-057 still owns the risk-register surface.
        self.assertIn('findings: "Findings"', i18n_text)
        self.assertIn("fetchGovernanceFindingsRegistersBundle", findings_query_text)
        self.assertIn("decisionRegisterRows", findings_query_text)
        self.assertIn("fetchGovernanceFindingQueueRows", findings_query_text)
        self.assertIn("matchesRiskRegisterFilter", client_text)
        self.assertIn("waiver-expiring", page_constants_text)

        csv_text = csv_module.read_text(encoding="utf-8")
        self.assertIn("lastReviewedUtc", csv_text)
        self.assertIn('"Last reviewed"', csv_text)

        reader_text = reader.read_text(encoding="utf-8")
        self.assertIn("GoldenManifestId AS ManifestId", reader_text)


if __name__ == "__main__":
    unittest.main()
