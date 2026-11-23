"""Guard remediation app-role DML posture and direct-write escape hatches.

Structural checks are not proof that an application identity has been
provisioned correctly in a deployed tenant catalog. The SQL fixture test
verifies effective permissions with EXECUTE AS when a test SQL Server exists.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
MIGRATION = ROOT / "ArchLucid.Persistence/Migrations/426_RemediationRoleWritePermissions.sql"
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
        # This tuple must exist in required DML, not in the DENY list:
        # the production repository must retain scoped-CAS UPDATE access.
        denied = code.split("RemediationDenyPermissions =", 1)[1].split(
            "RemediationRequiredPermissions =", 1)[0]
        allowed = code.split("RemediationRequiredPermissions =", 1)[1].split(
            "internal static bool ShouldValidate(", 1)[0]
        self.assertNotIn('("dbo.RemediationInstances", "UPDATE")', denied)
        self.assertIn('("dbo.RemediationInstances", "UPDATE")', allowed)
        self.assertIn('("dbo.RemediationEvidence", "INSERT")', allowed)
        self.assertIn("SqlDatabaseImmutabilityProbeHelpers.IsCurrentPrincipalRoleMember(", code)
        helper = (ROOT / "ArchLucid.Host.Core/Startup/Validation/Rules/"
                  "SqlDatabaseImmutabilityProbeHelpers.cs").read_text()
        self.assertIn("IS_ROLEMEMBER(@RoleName)", helper)

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
            "426_RemediationRoleWritePermissions.sql",
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
