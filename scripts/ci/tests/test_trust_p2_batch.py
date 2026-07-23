"""TB-288 / TB-301 trust P2 drift guards (batch 5DX-trust-p2)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

TB_301_SCOPE_ISOLATION_FILES = (
    "SqlRunRepositoryScopeIsolationSqlIntegrationTests.cs",
    "SqlGoldenManifestRepositoryScopeIsolationSqlIntegrationTests.cs",
    "DapperAuditRepositoryScopeIsolationSqlIntegrationTests.cs",
    "SqlGovernanceApprovalRequestRepositoryScopeIsolationSqlIntegrationTests.cs",
    "SqlDecisionTraceRepositoryScopeIsolationSqlIntegrationTests.cs",
)


class TestTrustP2Batch(unittest.TestCase):
    def test_buyer_facing_dto_boundary_architecture_guard_wired(self) -> None:
        path = REPO_ROOT / "scripts" / "ci" / "tests" / "test_dto_boundary_batch.py"
        text = path.read_text(encoding="utf-8")
        self.assertIn("test_buyer_facing_dto_boundary_architecture_tests_exist", text)

    def test_tb301_persistence_scope_isolation_sql_probes_exist(self) -> None:
        persistence_tests = REPO_ROOT / "ArchLucid.Persistence.Tests"
        for file_name in TB_301_SCOPE_ISOLATION_FILES:
            path = persistence_tests / file_name
            self.assertTrue(path.is_file(), f"Missing {path}")
            text = path.read_text(encoding="utf-8")
            self.assertIn("TB-301", text, f"{file_name} must cite TB-301")
            self.assertIn("wrong_scope", text, f"{file_name} must assert wrong-scope denial")

    def test_coverage_gap_analysis_notes_tb301_hotspots(self) -> None:
        path = REPO_ROOT / "docs" / "COVERAGE_GAP_ANALYSIS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("TB-301", text)
        for probe in (
            "SqlRunRepository.GetByIdAsync",
            "DapperAuditRepository.GetFilteredAsync",
            "SqlGoldenManifestRepository.GetByIdAsync",
            "GovernanceApprovalRequestRepository.GetByIdAsync",
            "SqlDecisionTraceRepository.GetByIdAsync",
        ):
            self.assertIn(probe, text, f"COVERAGE_GAP_ANALYSIS must note TB-301 probe for {probe}")


if __name__ == "__main__":
    unittest.main()
