"""TB-228 tenant health admin surface drift guards (Batch 5BN)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BN(unittest.TestCase):
    def test_tb_228_admin_endpoint(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "AdminCustomerSuccessController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("tenant-health", text)
        self.assertIn("AdminAuthority", text)
        self.assertIn("AdminTenantHealthListResponse", text)

    def test_tb_228_sql_reader(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "CustomerSuccess" / "SqlAdminTenantHealthReader.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("TenantHealthScores", text)
        self.assertIn("RunsLast7d", text)

    def test_tb_228_admin_ui_page(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "internal"
            / "tenant-health"
            / "_sections"
            / "TenantHealthAdminPageClient.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("tenant-health-admin-page", text)
        self.assertIn("engagementScoreSeverityKind", text)


if __name__ == "__main__":
    unittest.main()
