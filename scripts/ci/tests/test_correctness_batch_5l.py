"""TB-201 AgentResults unique constraint drift guards (Batch 5L)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessBatch5L(unittest.TestCase):
    def test_tb_201_agent_results_run_task_unique_migration_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "237_AgentResults_RunId_TaskId_Unique.sql"
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("UX_AgentResults_RunId_TaskId", text)

    def test_tb_201_agent_result_duplicate_conflict_exception_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Persistence" / "AgentResultDuplicateConflictException.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_tb_201_submit_agent_result_maps_conflict_failure_kind(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application" / "ArchitectureApplicationService.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentResultDuplicateConflictException", text)
        self.assertIn("ApplicationServiceFailureKind.Conflict", text)


if __name__ == "__main__":
    unittest.main()
