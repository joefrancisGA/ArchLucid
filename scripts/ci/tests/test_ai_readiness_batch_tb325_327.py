"""TB-325–TB-327 AI/Agent Readiness guard drift checks."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatchTb325327(unittest.TestCase):
    def test_tb_325_prompt_injection_guard_script_exists(self) -> None:
        path = REPO_ROOT / "scripts" / "ci" / "assert_prompt_injection_guard.py"
        self.assertTrue(path.is_file())

    def test_tb_325_typed_rejection_exception_exists(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "RequestContentSafetyRejectedException.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("RequestContentSafetyRejectedException", text)

    def test_tb_326_fallback_client_marks_degraded_traces(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "AgentCompletionModelMetadata.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("LlmCompletionFallbackDeploymentPrefix", text)
        self.assertIn("TryConsumeLastFallbackUsed", text)

    def test_tb_327_token_budget_reason_code_exists(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Contracts"
            / "Agents"
            / "AgentExecutionTraceFailureReasonCodes.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("TokenBudgetExceeded", text)

    def test_tb_327_cost_guardrail_interceptor_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "CostGuardrailInterceptorTests.cs"
        self.assertTrue(path.is_file())


if __name__ == "__main__":
    unittest.main()
