"""TB-064 system-catalog consolidated DDL drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SYSTEM_DDL = REPO_ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid.System.sql"
STARTUP = REPO_ROOT / "ArchLucid.Host.Core" / "Startup" / "ArchLucidPersistenceStartup.cs"

REQUIRED_TABLES = (
    "dbo.Tenants",
    "dbo.TenantDatabaseBindings",
    "dbo.TenantDatabaseProvisioningJobs",
    "dbo.WarmTenantCatalogStandby",
)


class TestConsolidatedSystemDdlTb064(unittest.TestCase):
    def test_tb_064_consolidated_system_ddl_is_not_a_stub(self) -> None:
        ddl = SYSTEM_DDL.read_text(encoding="utf-8")

        self.assertGreater(len(ddl.splitlines()), 50)
        self.assertNotIn("see ArchLucid.Persistence/Migrations/System", ddl)

    def test_tb_064_consolidated_system_ddl_lists_control_plane_tables(self) -> None:
        ddl = SYSTEM_DDL.read_text(encoding="utf-8")

        for table in REQUIRED_TABLES:
            with self.subTest(table=table):
                self.assertIn(f"CREATE TABLE {table}", ddl)

    def test_tb_064_startup_runs_system_bootstrap_after_run_system(self) -> None:
        text = STARTUP.read_text(encoding="utf-8")

        run_system_call = text.index("DatabaseMigrator.RunSystem(systemConnectionString);")
        bootstrap_call = text.index(
            "RunSystemSchemaBootstrapIfAvailableAsync(app, systemConnectionString, persistenceOptions)",
        )

        self.assertLess(run_system_call, bootstrap_call)
        self.assertIn("PersistenceScriptPaths.ResolveSystemScriptPath", text)


if __name__ == "__main__":
    unittest.main()
