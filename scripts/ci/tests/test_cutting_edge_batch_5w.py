"""TB-191 prompt template content-hash pinning drift guards (Batch 5W)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCuttingEdgeBatch5W(unittest.TestCase):
    def test_tb_191_content_hash_on_agent_execution_trace_contract(self) -> None:
        path = REPO_ROOT / "ArchLucid.Contracts" / "Agents" / "AgentExecutionTrace.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SystemPromptContentHash", text)

    def test_tb_191_recorder_computes_content_hash(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "AgentExecutionTraceRecorder.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SystemPromptContentHash", text)
        self.assertIn("AgentPromptCanonicalHasher", text)

    def test_tb_191_db_migration_adds_column(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Persistence"
            / "Migrations"
            / "239_AgentExecutionTraces_SystemPromptContentHash.sql"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("SystemPromptContentHash", text)
        self.assertIn("NVARCHAR(32)", text)

    def test_tb_191_repository_persists_content_hash_column(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "Data" / "Repositories" / "AgentExecutionTraceRepository.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("@SystemPromptContentHash", text)

    def test_tb_191_hasher_unit_tests(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "AgentPromptReproTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ContentHashPrefix16_same_prompt_same_hash", text)
        self.assertIn("ContentHashPrefix16_one_character_change_produces_different_hash", text)


if __name__ == "__main__":
    unittest.main()
