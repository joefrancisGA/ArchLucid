"""TB-011 / TB-030 architecture invariant drift guards (Batch 5D)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestInvariantWaveBBatch(unittest.TestCase):
    def test_inv_004_budget_tracker_architecture_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "LlmBudgetTrackerArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_012_api_quality_gate_consumer_tests_exist(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Architecture.Tests"
            / "AgentOutputQualityGateApiConsumerArchitectureTests.cs"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_013_replay_commit_uses_replay_guid_guard(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "ReplayReadOnlyScopeArchitectureTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("PersistCommittedChainAsync(scope, replayGuid,", text)

    def test_tb_030_dependency_constraint_tier_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "DependencyConstraintTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("TB-030 gap closure", text)
        self.assertIn("Jobs_Cli_must_not_depend_on_Application_directly", text)
        self.assertIn("Mcp_must_not_depend_on_Application_layer_namespaces", text)

    def test_architecture_tests_reference_jobs_cli_and_mcp(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "ArchLucid.Architecture.Tests.csproj"
        text = path.read_text(encoding="utf-8")
        for fragment in (
            "ArchLucid.Jobs.Cli",
            "ArchLucid.Mcp",
            "ArchLucid.AgentSimulator",
            "ArchLucid.Integrations.AzureExtractor",
        ):
            self.assertIn(fragment, text, fragment)


if __name__ == "__main__":
    unittest.main()
