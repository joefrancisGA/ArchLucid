"""TB-196 reasoning token cost aggregator drift guards (Batch 5R)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessBatch5R(unittest.TestCase):
    def test_tb_196_aggregator_forwards_reasoning_tokens(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Agents"
            / "AgentExecutionTraceRunLlmCostAggregator.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("trace.ReasoningTokenCount ?? 0", text)
        self.assertNotIn("EstimateUsd(inTok, outTok, 0,", text)

    def test_tb_196_reasoning_token_cost_tests_exist(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application.Tests"
            / "Agents"
            / "AgentExecutionTraceRunLlmCostAggregatorTests.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("Compute_WithReasoningTokens_IncludesReasoningCostInEstimate", text)
        self.assertIn("Compute_ReasoningTokensOnlyTrace_StillAccumulatesCost", text)


if __name__ == "__main__":
    unittest.main()
