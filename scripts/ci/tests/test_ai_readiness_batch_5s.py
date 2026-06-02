"""TB-179 multi-model tiered orchestration drift guards (Batch 5S)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5S(unittest.TestCase):
    def test_tb_179_starter_task_factory_assigns_tier_overrides(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application" / "Runs" / "Coordination" / "RunStarterTaskFactory.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ModelTierOverride = LlmModelTier.Economy", text)
        self.assertIn("ModelTierOverride = LlmModelTier.Premium", text)

    def test_tb_179_default_agent_type_tier_mappings_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "AgentModelTierDefaults.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn('["Topology"] = nameof(LlmModelTier.Economy)', text)
        self.assertIn('["Cost"] = nameof(LlmModelTier.Economy)', text)
        self.assertIn('["Compliance"] = nameof(LlmModelTier.Premium)', text)
        self.assertIn('["Critic"] = nameof(LlmModelTier.Premium)', text)

    def test_tb_179_llm_deployments_config_aliases_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "AgentModelTierResolver.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn('Llm:Deployments:Fast', text)
        self.assertIn('Llm:Deployments:Reasoning', text)

    def test_tb_179_starter_task_tier_tests_exist(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application.Tests"
            / "Runs"
            / "Coordination"
            / "RunStarterTaskFactoryTierTests.cs"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("BuildStarterTasks_assigns_model_tier_overrides_for_quad_agent_run", text)


if __name__ == "__main__":
    unittest.main()
