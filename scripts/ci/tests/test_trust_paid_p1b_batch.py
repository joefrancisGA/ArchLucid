"""TB-295–300 paid-pilot trust coverage drift guards (batch 5DW-trust-paid-p1b)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

GOVERNANCE_NEGATIVE_SCENARIOS = (
    "Self_approval_returns_governance_self_approval_problem_and_audit_tb297",
    "Reject_after_approve_returns_conflict_tb297",
    "Double_promote_to_prod_with_same_approval_returns_bad_request_tb297",
    "Promote_with_stale_manifest_version_returns_bad_request_tb297",
)

SCOPE_IDENTITY_PERMUTATIONS = (
    "ApiKey_with_mismatched_tenant_header_returns_forbidden",
    "ApiKey_without_tenant_claim_rejects_tenant_header_escalation",
    "Jwt_with_mismatched_tenant_header_returns_forbidden_tb300",
    "DevBypass_with_mismatched_tenant_header_returns_forbidden_tb300",
)


class TestTrustPaidP1bBatch(unittest.TestCase):
    def test_audit_export_tenant_isolation_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "AuditExportTenantIsolationIntegrationTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("/v1/audit/export/csv", text)
        self.assertIn("/v1/audit?take=200", text)

    def test_export_push_ssrf_integration_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("127.0.0.1", text, "TB-296 internal IP SSRF regression")
        self.assertIn("evil.example.com", text, "TB-296 non-blob host regression")
        self.assertIn("PlaceholderAzureBlobSasUrl", text, "TB-296 allowed blob smoke")

    def test_manifest_artifact_download_success_path_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Matching_tenant_committed_run_artifact_list_and_download_return_bytes_sql_tb298", text)

    def test_governance_negative_path_matrix_covers_scenarios(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Governance" / "GovernanceNegativePathIntegrationTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        for scenario in GOVERNANCE_NEGATIVE_SCENARIOS:
            self.assertIn(scenario, text, f"TB-297 must cover {scenario}")

    def test_executive_board_pack_live_e2e_exists(self) -> None:
        api_tests = REPO_ROOT / "ArchLucid.Api.Tests" / "SponsorRoiBoardPackEndpointTests.cs"
        live_spec = REPO_ROOT / "archlucid-ui" / "e2e" / "live-api-sponsor-board-pack.spec.ts"
        self.assertTrue(api_tests.is_file(), f"Missing {api_tests}")
        self.assertTrue(live_spec.is_file(), f"Missing {live_spec}")

    def test_scope_identity_auth_permutation_table_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopeIdentityBindingIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        for name in SCOPE_IDENTITY_PERMUTATIONS:
            self.assertIn(name, text, f"TB-300 must cover {name}")

        pen_test = REPO_ROOT / "docs" / "security" / "pen-test-summaries" / "2026-Q2-OWNER-CONDUCTED.md"
        pen_text = pen_test.read_text(encoding="utf-8")
        self.assertIn("Scope identity auth permutation", pen_text)


if __name__ == "__main__":
    unittest.main()
