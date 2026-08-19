"""TB-198/199/200 correctness drift guards (Batch 5K)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessBatch5K(unittest.TestCase):
    def test_tb_198_cost_constraint_finding_engine_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Capabilities.Cost.Tests" / "CostConstraintFindingEngineTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("AnalyzeAsync_ReturnsFindingPerCostNode", text)

    def test_tb_199_tenant_or_project_capability_handler_tests_exist(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Host.Core.Tests"
            / "TenantOrProjectCapabilityAuthorizationHandlerTests.cs"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_tb_200_http_scope_context_provider_tests_exist(self) -> None:
        host_core = REPO_ROOT / "ArchLucid.Host.Core.Tests" / "HttpScopeContextProviderTests.cs"
        api = REPO_ROOT / "ArchLucid.Api.Tests" / "HttpScopeContextProviderTests.cs"
        self.assertTrue(host_core.is_file(), f"Missing {host_core}")
        self.assertTrue(api.is_file(), f"Missing {api}")


if __name__ == "__main__":
    unittest.main()
