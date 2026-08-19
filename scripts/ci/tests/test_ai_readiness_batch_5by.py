"""TB-190 LLM judge sub-cap and Cost/Compliance eligibility drift guards (Batch 5BY)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BY(unittest.TestCase):
    def test_tb_190_judge_daily_budget_table(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "241_LlmJudgeDailyTenantTokenWindowState.sql"
        text = path.read_text(encoding="utf-8")
        self.assertIn("LlmJudgeDailyTenantTokenWindowState", text)

    def test_tb_190_judge_budget_tracker(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "LlmJudgeDailyTokenBudgetTracker.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("LlmBudgetPeriod.JudgeDaily", text)
        self.assertIn("ILlmJudgeBudgetTracker", text)

    def test_tb_190_cost_and_compliance_eligible(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.AgentRuntime"
            / "Evaluation"
            / "AgentOutputLlmSemanticJudge.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentType.Cost", text)
        self.assertIn("AgentType.Compliance", text)
        self.assertIn("TryPeekWithinBudgetAsync", text)

    def test_tb_190_judge_completion_chain_uses_isolated_cap(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Host.Composition"
            / "Startup"
            / "ServiceCollectionExtensions.Agents.CompletionPipeline.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("useJudgeDailyCapOnly: true", text)


if __name__ == "__main__":
    unittest.main()
