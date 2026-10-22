"""TB-044 AgentExecutionTraces upsert and unique index drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatchTb044(unittest.TestCase):
    def test_tb_044_repository_delete_then_insert_upsert(self) -> None:
        sql_path = REPO_ROOT / "ArchLucid.Persistence" / "Sql" / "AgentExecutionTraceSql.cs"
        sql_text = sql_path.read_text(encoding="utf-8")
        self.assertIn("DeleteSameAttempt", sql_text)
        self.assertIn("DeleteLaterAttempts", sql_text)
        self.assertIn("@AttemptIndex", sql_text)

        repo_path = REPO_ROOT / "ArchLucid.Persistence" / "Data" / "Repositories" / "AgentExecutionTraceRepository.cs"
        repo_text = repo_path.read_text(encoding="utf-8")
        self.assertIn("DeleteSameAttempt", repo_text)
        self.assertIn("DeleteLaterAttempts", repo_text)

    def test_tb_044_unique_index_includes_attempt_index(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Persistence"
            / "Migrations"
            / "250_AgentExecutionTraces_SchemaRemediationAttemptIndex.sql"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("UX_AgentExecutionTraces_RunId_TaskId_AgentType_AttemptIndex", text)

    def test_tb_044_contract_tests_cover_upsert_and_reexecute(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence.Tests" / "Contracts" / "AgentExecutionTraceRepositoryContractTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("CreateAsync_upserts_same_run_task_and_agent_type", text)
        self.assertIn("CreateAsync_at_attempt_zero_clears_prior_attempt_rows_on_reexecute", text)


if __name__ == "__main__":
    unittest.main()
