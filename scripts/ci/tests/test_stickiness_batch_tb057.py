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
        page_constants = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "architecture-risk-register-page.ts"
        csv_module = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "architecture-risk-register-csv.ts"
        reader = REPO_ROOT / "ArchLucid.Persistence" / "Governance" / "ArchitectureRiskRegisterReader.cs"
        i18n = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "i18n.ts"

        client_text = client.read_text(encoding="utf-8")
        page_constants_text = page_constants.read_text(encoding="utf-8")
        self.assertIn("ARCHITECTURE_RISK_REGISTER_PAGE_TITLE", client_text)
        self.assertIn("Architecture risk register", page_constants_text)
        self.assertIn("getArchitectureDecisionRegister", client_text)
        self.assertIn("decisionRegisterRows", client_text)
        self.assertIn("waiver-expiring", client_text)

        csv_text = csv_module.read_text(encoding="utf-8")
        self.assertIn("lastReviewedUtc", csv_text)
        self.assertIn('"Last reviewed"', csv_text)

        reader_text = reader.read_text(encoding="utf-8")
        self.assertIn("GoldenManifestId AS ManifestId", reader_text)

        i18n_text = i18n.read_text(encoding="utf-8")
        self.assertIn('findings: "Risk register"', i18n_text)


if __name__ == "__main__":
    unittest.main()
