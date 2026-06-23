"""TB-069 / TB-070 maintainability drift guards (Batch 5CM)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestMaintainabilityBatch5CM(unittest.TestCase):
    def test_tb_070_no_archiforge_in_persistence_supplement(self) -> None:
        supplement = REPO_ROOT / "ArchLucid.Persistence.Tests" / "Scripts" / "PersistenceContractSupplement.sql"
        text = supplement.read_text(encoding="utf-8")
        self.assertNotIn("ArchiForge.sql", text)
        self.assertIn("ArchLucid.sql", text)

    def test_tb_069_runner_documented_in_sql_scripts(self) -> None:
        doc = REPO_ROOT / "docs" / "library" / "SQL_SCRIPTS.md"
        text = doc.read_text(encoding="utf-8")
        self.assertIn("GreenfieldBaselineMigrationRunner", text)
        self.assertIn("4.0.1", text)

    def test_tb_069_baseline_repair_planner_present(self) -> None:
        planner = REPO_ROOT / "ArchLucid.Persistence" / "Data" / "Infrastructure" / "BaselineRepairPlanner.cs"
        sentinels = REPO_ROOT / "ArchLucid.Persistence" / "Data" / "Infrastructure" / "BaselineCatalogSentinels.cs"
        integration = (
            REPO_ROOT
            / "ArchLucid.Persistence.Tests"
            / "Data"
            / "Infrastructure"
            / "GreenfieldBaselineMigrationRunnerSqlIntegrationTests.cs"
        )
        self.assertTrue(planner.is_file())
        self.assertTrue(sentinels.is_file())
        self.assertTrue(integration.is_file())


if __name__ == "__main__":
    unittest.main()
