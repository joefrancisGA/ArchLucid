"""TB-177 adversarial Critic posture drift guards (Batch 5M)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5M(unittest.TestCase):
    def test_tb_177_critic_prompt_requires_adversarial_posture(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "Prompts" / "CriticSystemPromptTemplate.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("You MUST challenge the other agents' implied decisions", text)
        self.assertIn("Do NOT treat prior agent outputs as correct by default", text)
        self.assertIn("missing failure mode", text)

    def test_tb_177_heuristic_penalizes_empty_critic_findings(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.AgentRuntime"
            / "Evaluation"
            / "HeuristicAgentOutputSemanticEvaluator.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentType.Critic && !hasFindings", text)

    def test_tb_177_critic_empty_findings_quality_gate_test_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "CriticAgentHandlerTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("EmptyFindingsCriticOutput_DoesNotPassQualityGateWarnThreshold", text)
        self.assertIn("AgentOutputQualityGate", text)

    def test_tb_177_agent_output_evaluation_documents_empty_critic_warning(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "AGENT_OUTPUT_EVALUATION.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Critic adversarial posture (TB-177)", text)
        self.assertIn("empty Critic result is suspicious", text)


if __name__ == "__main__":
    unittest.main()
