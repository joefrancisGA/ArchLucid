"""TB-078 cross-tenant isolation integration test matrix drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

# V1 matrix — see docs/library/TECH_BACKLOG.md TB-078 and docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md
PERSISTENCE_ISOLATION_TESTS = (
    "SqlFindingsSnapshotRepositoryScopeIsolationSqlIntegrationTests.cs",
    "SqlContextSnapshotRepositoryScopeIsolationSqlIntegrationTests.cs",
    "SqlGraphSnapshotRepositoryScopeIsolationSqlIntegrationTests.cs",
)

API_ISOLATION_TESTS = (
    "ScopedSnapshotReadIdorIntegrationTests.cs",
    "ScopeIdentityBindingIntegrationTests.cs",
    "TenantIsolationSmokeTests.cs",
)

RETRIEVAL_ISOLATION_TESTS = (
    "RetrievalIndexingScopeValidatorTests.cs",
    "AzureSearchTenantScopeFilterBuilderTests.cs",
)


class TestCrossTenantIsolationMatrixBatch(unittest.TestCase):
    def test_persistence_snapshot_idor_tests_exist(self) -> None:
        root = REPO_ROOT / "ArchLucid.Persistence.Tests"
        for name in PERSISTENCE_ISOLATION_TESTS:
            path = root / name
            self.assertTrue(path.is_file(), f"Missing {path}")

    def test_api_scope_and_idor_tests_exist(self) -> None:
        security_dir = REPO_ROOT / "ArchLucid.Api.Tests" / "Security"
        for name in ("ScopedSnapshotReadIdorIntegrationTests.cs", "ScopeIdentityBindingIntegrationTests.cs"):
            path = security_dir / name
            self.assertTrue(path.is_file(), f"Missing {path}")

        smoke_path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "TenantIsolationSmokeTests.cs"
        self.assertTrue(smoke_path.is_file(), f"Missing {smoke_path}")

    def test_retrieval_indexing_and_search_filter_tests_exist(self) -> None:
        root = REPO_ROOT / "ArchLucid.Retrieval.Tests"
        for name in RETRIEVAL_ISOLATION_TESTS:
            path = root / name
            self.assertTrue(path.is_file(), f"Missing {path}")

    def test_scope_identity_binding_middleware_is_wired(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Startup" / "PipelineExtensions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ScopeIdentityBindingMiddleware", text)

    def test_tenant_retrieval_boundary_proof_script_exists(self) -> None:
        path = REPO_ROOT / "scripts" / "ci" / "report_tenant_retrieval_boundary_proof.py"
        self.assertTrue(path.is_file(), f"Missing {path}")


if __name__ == "__main__":
    unittest.main()
