"""TB-183 findings priority re-ranker drift guards (Batch 5BL)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BL(unittest.TestCase):
    def test_tb_183_reranker_service(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application" / "Findings" / "FindingPriorityReranker.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IFindingPriorityReranker", text)
        self.assertIn("UpdatePriorityRanksAsync", text)

    def test_tb_183_order_by_priority_api(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Authority" / "RunQueryController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("orderBy", text)
        self.assertIn("orderByPriority", text)
        self.assertIn("PriorityRank", text)

    def test_tb_183_feature_flag_and_migration(self) -> None:
        options = (REPO_ROOT / "ArchLucid.Core" / "Configuration" / "RerankFindingsOptions.cs").read_text(
            encoding="utf-8"
        )
        self.assertIn("AgentRuntime:RerankFindings", options)
        migration = REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "180_FindingRecords_PriorityRank.sql"
        self.assertTrue(migration.is_file())
        self.assertIn("PriorityRank", migration.read_text(encoding="utf-8"))

    def test_tb_183_unit_tests(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Findings" / "FindingPriorityRerankerTests.cs"
        self.assertTrue(path.is_file())


if __name__ == "__main__":
    unittest.main()
