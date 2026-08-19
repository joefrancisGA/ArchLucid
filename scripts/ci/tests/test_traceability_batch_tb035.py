"""TB-035 schema-remediation attempt trace drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatchTb035(unittest.TestCase):
    def test_tb_035_attempt_index_on_agent_execution_trace_contract(self) -> None:
        path = REPO_ROOT / "ArchLucid.Contracts" / "Agents" / "AgentExecutionTrace.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AttemptIndex", text)

    def test_tb_035_schema_remediation_failure_reason_code(self) -> None:
        path = REPO_ROOT / "ArchLucid.Contracts" / "Agents" / "AgentExecutionTraceFailureReasonCodes.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SchemaRemediationParseFailed", text)

    def test_tb_035_llm_schema_completion_records_attempts(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "LlmAgentSchemaCompletion.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentSchemaRemediationTraceSupport", text)
        self.assertIn("IAgentExecutionTraceRecorder", text)

    def test_tb_035_db_migration_adds_attempt_index(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Persistence"
            / "Migrations"
            / "250_AgentExecutionTraces_SchemaRemediationAttemptIndex.sql"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("AttemptIndex", text)
        self.assertIn("UX_AgentExecutionTraces_RunId_TaskId_AgentType_AttemptIndex", text)

    def test_tb_035_repository_scopes_delete_by_attempt_index(self) -> None:
        sql_path = REPO_ROOT / "ArchLucid.Persistence" / "Sql" / "AgentExecutionTraceSql.cs"
        sql_text = sql_path.read_text(encoding="utf-8")
        self.assertIn("@AttemptIndex", sql_text)

        repo_path = REPO_ROOT / "ArchLucid.Persistence" / "Data" / "Repositories" / "AgentExecutionTraceRepository.cs"
        repo_text = repo_path.read_text(encoding="utf-8")
        self.assertIn("DeleteLaterAttempts", repo_text)

    def test_tb_035_unit_test_two_failures_then_success(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "LlmAgentSchemaCompletionTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("CompleteAsync_two_failures_then_success_persists_three_attempt_traces", text)


if __name__ == "__main__":
    unittest.main()
