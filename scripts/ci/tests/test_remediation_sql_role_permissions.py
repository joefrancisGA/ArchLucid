"""Guard remediation app-role DML posture and direct-write escape hatches.

Structural checks are not proof that an application identity has been
provisioned correctly in a deployed tenant catalog. The SQL fixture test
verifies effective permissions with EXECUTE AS when a test SQL Server exists.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[3]
MIGRATION = ROOT / "ArchLucid.Persistence/Migrations/426_RemediationRoleWritePermissions.sql"
PROCEDURES = ROOT / "ArchLucid.Persistence/Migrations/427_RemediationProcedureOnlyUpdates.sql"
SCHEMA = ROOT / "ArchLucid.Persistence/Scripts/ArchLucid.sql"
STARTUP = ROOT / "ArchLucid.Host.Core/Startup/Validation/Rules/SqlSealedEvidenceImmutabilityRules.cs"
DELETE = ROOT / "ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Delete.cs"
SQL_TEST = ROOT / "ArchLucid.Persistence.Tests/Sql/RemediationSqlRolePrivilegesTests.cs"
PATH_FK_MIGRATION = ROOT / "ArchLucid.Persistence/Migrations/384_RemediationInstancePathNarrative.sql"


class RemediationSqlRolePermissionsTests(unittest.TestCase):
    def test_migration_denies_only_unsafe_remediation_dml(self):
        script = MIGRATION.read_text()
        self.assertIn("DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL", script)
        self.assertIn("DENY UPDATE ON dbo.RemediationEvidence TO [ArchLucidApp]", script)
        self.assertIn("DENY DELETE ON dbo.RemediationEvidence TO [ArchLucidApp]", script)
        self.assertIn("DENY DELETE ON dbo.RemediationInstances TO [ArchLucidApp]", script)
        self.assertNotIn("DENY UPDATE ON dbo.RemediationInstances TO [ArchLucidApp]", script)
        self.assertEqual(3, script.count("AND NOT EXISTS ("))
        self.assertEqual(3, script.count("p.state_desc = N'DENY'"))

    def test_consolidated_schema_retains_the_migration_permissions(self):
        migration = MIGRATION.read_text()
        schema = SCHEMA.read_text()
        self.assertIn(migration.strip(), schema)

    def test_production_like_startup_checks_role_and_effective_permissions(self):
        code = STARTUP.read_text()
        for expression in (
            '("dbo.RemediationInstances", "DELETE")',
            '("dbo.RemediationEvidence", "UPDATE")',
            '("dbo.RemediationEvidence", "DELETE")',
            "SqlDatabaseImmutabilityProbeHelpers.HasDenyPermission(",
            "SqlDatabaseImmutabilityProbeHelpers.HasEffectivePermission(",
            "SqlDatabaseImmutabilityProbeHelpers.RoleExists(",
            "Remediation SQL permissions:",
        ):
            with self.subTest(expression=expression):
                self.assertIn(expression, code)
        # Direct UPDATE must be denied; only the procedures may mutate instances.
        denied = code.split("RemediationDenyPermissions =", 1)[1].split(
            "RemediationRequiredPermissions =", 1)[0]
        allowed = code.split("RemediationRequiredPermissions =", 1)[1].split(
            "internal static bool ShouldValidate(", 1)[0]
        self.assertIn('("dbo.RemediationInstances", "UPDATE")', denied)
        self.assertNotIn('("dbo.RemediationInstances", "UPDATE")', allowed)
        self.assertIn("dbo.uspRemediationUpdateScoped", code)
        self.assertIn("dbo.uspRemediationCommitApproval", code)
        self.assertIn("dbo.uspRemediationCommitVerification", code)
        self.assertIn("ProcedureExists(", code)
        for table in ("dbo.RemediationInstances", "dbo.RemediationEvidence"):
            self.assertIn(f'("{table}", "INSERT")', denied)
            self.assertNotIn(f'("{table}", "INSERT")', allowed)
        self.assertIn("dbo.uspRemediationCreateScoped", code)
        self.assertIn("dbo.uspRemediationAppendEvidenceScoped", code)
        self.assertIn("SqlDatabaseImmutabilityProbeHelpers.IsCurrentPrincipalRoleMember(", code)
        helper = (ROOT / "ArchLucid.Host.Core/Startup/Validation/Rules/"
                  "SqlDatabaseImmutabilityProbeHelpers.cs").read_text()
        self.assertIn("IS_ROLEMEMBER(@RoleName)", helper)

    def test_every_stored_procedure_parameter_uses_valid_tsql_at_prefix(self):
        sql = PROCEDURES.read_text()
        modules = re.findall(
            r"CREATE OR ALTER PROCEDURE dbo\.(\w+)\n(.*?)\nWITH EXECUTE AS OWNER",
            sql, flags=re.DOTALL,
        )
        self.assertEqual(3, len(modules), "validate every owner-context SQL procedure")
        for name, declarations in modules:
            lines = [line.strip().rstrip(",") for line in declarations.splitlines()
                     if line.strip()]
            self.assertGreater(len(lines), 5, name)
            for line in lines:
                with self.subTest(procedure=name, declaration=line):
                    self.assertRegex(
                        line,
                        r"^@[A-Za-z][A-Za-z0-9_]*\s+"
                        r"(?:UNIQUEIDENTIFIER|VARBINARY\(\d+\)|INT|"
                        r"NVARCHAR\((?:MAX|\d+)\)|DATETIME2)$",
                        "bare identifiers in SQL procedure parameter declarations "
                        "break DbUp migration 427 before any tests can execute",
                    )

    def test_scoped_updates_have_single_db_authority_not_table_write(self):
        sql = PROCEDURES.read_text()
        schema = SCHEMA.read_text()
        self.assertIn(sql.rstrip(), schema)
        for name in ("uspRemediationUpdateScoped", "uspRemediationCommitApproval",
                     "uspRemediationCommitVerification"):
            self.assertIn("CREATE OR ALTER PROCEDURE dbo." + name, sql)
            self.assertIn("GRANT EXECUTE ON OBJECT::dbo." + name, sql)
        self.assertIn("DENY UPDATE ON OBJECT::dbo.RemediationInstances TO [ArchLucidApp]", sql)
        self.assertEqual(3, sql.count("WITH EXECUTE AS OWNER"))
        self.assertEqual(3, sql.count("AND RowVersion = @ExpectedRowVersion"))
        self.assertIn("THROW 50427", sql)
        for path in (
            "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs",
            "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.AtomicApproval.cs",
            "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.AtomicVerification.cs",
            "ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Delete.cs",
        ):
            self.assertNotIn("UPDATE dbo.RemediationInstances", (ROOT / path).read_text())

    def test_insert_boundary_is_mirrored_and_fail_closed(self):
        sql = (ROOT / "ArchLucid.Persistence/Migrations/428_RemediationProcedureOnlyInserts.sql").read_text()
        self.assertTrue(SCHEMA.read_text().rstrip().endswith(sql.rstrip()))
        for table in ("RemediationInstances", "RemediationEvidence"):
            self.assertIn(f"DENY INSERT ON OBJECT::dbo.{table} TO [ArchLucidApp]", sql)
        for name in ("uspRemediationCreateScoped", "uspRemediationAppendEvidenceScoped"):
            self.assertIn("CREATE OR ALTER PROCEDURE dbo." + name, sql)
            self.assertIn("GRANT EXECUTE ON OBJECT::dbo." + name, sql)
        self.assertEqual(2, sql.count("WITH EXECUTE AS OWNER"))
        self.assertIn("@Status <> 0", sql)
        self.assertIn("@Phase NOT IN (0, 1, 2)", sql)
        self.assertIn("AND Status = 4", sql)
        self.assertIn("AND v.Status = 2", sql)
        self.assertRegex(sql, r"AND WorkspaceId = @WorkspaceId\s+AND ProjectId = @ProjectId")
        repository = (ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs").read_text()
        for table in ("RemediationInstances", "RemediationEvidence"):
            self.assertNotIn(f"INSERT INTO dbo.{table}", repository)
        for name in ("uspRemediationCreateScoped", "uspRemediationAppendEvidenceScoped"):
            self.assertIn("dbo." + name, repository)

    def test_snapshot_delete_blocks_path_refs_instead_of_blind_instance_update(self):
        code = DELETE.read_text()
        self.assertNotIn("UPDATE dbo.RemediationInstances", code)
        self.assertNotIn("clearRemediationPathIdsSql", code)
        self.assertIn("const string remediationPathCountSql", code)
        self.assertIn("INNER JOIN dbo.SecurityEvidencePaths AS path", code)
        self.assertIn("path.PathId = instance.PathId", code)
        self.assertIn("path.TenantId = instance.TenantId", code)
        self.assertIn("path.SnapshotId = @SnapshotId", code)
        self.assertIn("AzureInventorySnapshotDeleteOutcome.BlockedReferencedByRemediationInstance", code)
        guard = code.index("const string remediationPathCountSql")
        cascade = code.index("private static async Task CascadeDeleteSnapshotRowsAsync(")
        self.assertLess(guard, cascade)

    def test_existing_remediation_path_fk_prevents_orphan_deletions(self):
        sql = PATH_FK_MIGRATION.read_text()
        self.assertIn("FK_RemediationInstances_SecurityEvidencePaths", sql)
        self.assertIn("FOREIGN KEY (PathId) REFERENCES dbo.SecurityEvidencePaths (PathId)", sql)
        self.assertNotIn("ON DELETE CASCADE", sql)

    def test_sql_integration_uses_impersonated_broad_writer_and_real_migration(self):
        code = SQL_TEST.read_text()
        for expression in (
            "GetManifestResourceNames()",
            "foreach (int migrationNumber in new[] { 426, 427, 428 })",
            "EXECUTE AS USER",
            "ALTER ROLE [db_datawriter] ADD MEMBER",
            "UPDATE dbo.RemediationEvidence",
            "DELETE FROM dbo.RemediationEvidence",
            "DELETE FROM dbo.RemediationInstances",
            "HAS_PERMS_BY_NAME",
            "REVERT;",
            "UPDATE dbo.RemediationInstances",
            "builder.InitialCatalog.Should().Contain(\"Test\"",
        ):
            with self.subTest(expression=expression):
                self.assertIn(expression, code)


if __name__ == "__main__":
    unittest.main()
