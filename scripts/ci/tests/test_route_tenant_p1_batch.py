"""TB-279–282 / TB-281 route-tenant P1 drift guards (batch 5DU-route-tenant-p1)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

LEGACY_EXECUTIVE_SUMMARY_FRAGMENT = "api/authority/sponsor-report"

SCOPE_ONLY_ROUTES = (
    ("/v1/value-report/generate", "ValueReportController"),
    ("/v1/admin/reference-evidence", "ReferenceEvidenceAdminController"),
    ("/v1/admin/metering/summary", "MeteringAdminController"),
    ("/v1/reports/sponsor-report", "Reports/SponsorReportController"),
)


class TestRouteTenantP1Batch(unittest.TestCase):
    def test_scope_only_value_report_generate_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "ValueReports" / "ValueReportController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn('[HttpPost("generate")]', text)
        self.assertIn("GenerateAsync", text)

    def test_scope_only_admin_routes_exist(self) -> None:
        ref = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "ReferenceEvidenceAdminController.cs"
        ref_text = ref.read_text(encoding="utf-8")
        self.assertIn("admin/reference-evidence", ref_text)
        self.assertNotIn("{tenantId:guid}", ref_text)

        metering = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "MeteringAdminController.cs"
        metering_text = metering.read_text(encoding="utf-8")
        self.assertIn('[HttpGet("summary")]', metering_text)

    def test_legacy_authority_executive_summary_controller_removed(self) -> None:
        legacy = (
            REPO_ROOT
            / "ArchLucid.Api"
            / "Controllers"
            / "Authority"
            / "SponsorReportController.cs"
        )
        self.assertFalse(legacy.is_file(), f"TB-280: remove {legacy}")

    def test_no_legacy_authority_executive_summary_in_product_sources(self) -> None:
        scan_roots = (
            REPO_ROOT / "ArchLucid.Api" / "Controllers",
            REPO_ROOT / "archlucid-ui" / "src",
            REPO_ROOT / "ArchLucid.Cli",
        )
        allow_suffixes = (
            "openapi-v1.contract.snapshot.json",
            "api-types.generated.ts",
            "ArchLucidApiClient.g.cs",
        )

        for root in scan_roots:
            for path in root.rglob("*"):
                if not path.is_file():
                    continue

                if path.suffix not in {".cs", ".ts", ".tsx"}:
                    continue

                if any(path.name.endswith(suffix) for suffix in allow_suffixes):
                    continue

                text = path.read_text(encoding="utf-8")

                if LEGACY_EXECUTIVE_SUMMARY_FRAGMENT in text:
                    self.fail(f"TB-280: legacy sponsor-report reference in {path.relative_to(REPO_ROOT)}")

    def test_cross_tenant_rollup_requires_platform_cross_tenant_read(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Api"
            / "Controllers"
            / "Admin"
            / "AdminCrossTenantUsageRollupController.cs"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("PlatformCrossTenantReadAuthority", text)
        self.assertIn("cross-tenant-summary", text)

        admin = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Admin" / "AdminController.cs"
        admin_text = admin.read_text(encoding="utf-8")
        self.assertNotIn("GetCrossTenantUsageSummary", admin_text)

    def test_scope_only_positive_path_matrix_in_idor_tests(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        for fragment, _ in SCOPE_ONLY_ROUTES:
            self.assertIn(fragment, text, f"TB-279/281 matrix must cover {fragment}")

    def test_ui_value_report_download_uses_scope_only_path(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "api" / "downloads-api.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/v1/value-report/generate", text)
        self.assertNotIn("/v1/value-report/${", text)

    def test_tb282_authorization_integration_tests_exist(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Api.Tests"
            / "Admin"
            / "AdminCrossTenantUsageRollupAuthorizationIntegrationTests.cs"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")


if __name__ == "__main__":
    unittest.main()
