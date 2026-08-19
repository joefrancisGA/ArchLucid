"""TB-039 execute-retry idempotent task skip drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatchTb039(unittest.TestCase):
    def test_tb_039_policy_lives_in_contracts(self) -> None:
        path = REPO_ROOT / "ArchLucid.Contracts" / "Agents" / "AgentExecuteIdempotentResultPolicy.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ShouldSkipRetry", text)
        self.assertIn("TB-039", text)

    def test_tb_039_real_agent_executor_loads_persisted_results(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "RealAgentExecutor.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("GetByRunIdAsync", text)
        self.assertIn("persistedByTaskId", text)

    def test_tb_039_single_handler_skips_before_dispatch(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "RealAgentExecutorSingleHandlerExecution.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentExecuteIdempotentResultPolicy.ShouldSkipRetry", text)
        self.assertIn("AgentExecuteTaskSkippedIdempotentTotal", text)

    def test_tb_039_orchestrator_uses_policy_for_completeness(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "ArchitectureRunExecuteOrchestrator.PreExecute.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentExecuteIdempotentResultPolicy.ShouldSkipRetry", text)

    def test_tb_039_executor_idempotency_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "RealAgentExecutorIdempotencyTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ExecuteAsync_when_persisted_successful_result_exists_skips_handler_for_that_task", text)
        self.assertIn("ExecuteAsync_when_persisted_degraded_result_exists_reinvokes_handler", text)

    def test_tb_039_simulator_idempotent_executor_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "IdempotentAgentExecutor.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentExecuteIdempotentResultPolicy.ShouldSkipRetry", text)

    def test_tb_039_execute_persist_reconciliation_exists(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "AgentExecuteIdempotentPersistReconciliation.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("ReplaceForRunTaskAsync", text)
        self.assertIn("ShouldInsertEvidencePackageAsync", text)


if __name__ == "__main__":
    unittest.main()
