"""Prevent reintroduction of a read-modify-unscoped-write default mutation."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]

class RemediationAtomicUpdateContractTests(unittest.TestCase):
    def test_legacy_tenant_only_update_is_absent_from_every_repository_surface(self):
        paths = (
            "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs",
            "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs",
            "ArchLucid.Persistence/InfraEvidence/NoOpRemediationInstanceRepository.cs",
            "ArchLucid.Application.Tests/InfraEvidence/RemediationInstanceServiceTests.cs",
            "ArchLucid.Application.Tests/InfraEvidence/RemediationPrioritizationAndWaveServiceTests.cs",
        )
        for path in paths:
            with self.subTest(path=path):
                source = (ROOT / path).read_text()
                self.assertNotIn("UpdateInstanceAsync(", source)

    def test_default_scoped_update_fails_closed(self):
        source = (ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs").read_text()
        method = source.split("Task UpdateInstanceInScopeAsync(", 1)[1].split("/// <summary>Persist verification evidence", 1)[0]
        self.assertIn("throw new NotSupportedException", method)
        self.assertNotIn("UpdateInstanceAsync(", method)
        self.assertNotIn("TryGetByIdInScopeAsync(", method)

    def test_role_migration_is_mirrored_and_does_not_disable_instance_updates(self):
        migration_path = ROOT / "ArchLucid.Persistence/Migrations/426_RemediationRoleWritePermissions.sql"
        migration = migration_path.read_text()
        consolidated = (ROOT / "ArchLucid.Persistence/Scripts/ArchLucid.sql").read_text()
        for sql in (
            "DENY UPDATE ON dbo.RemediationEvidence TO [ArchLucidApp]",
            "DENY DELETE ON dbo.RemediationEvidence TO [ArchLucidApp]",
            "DENY DELETE ON dbo.RemediationInstances TO [ArchLucidApp]",
        ):
            self.assertEqual(1, migration.count(sql))
            self.assertIn(sql, consolidated)
        self.assertNotIn("DENY UPDATE ON dbo.RemediationInstances", migration)
        self.assertIn("DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL", migration)
        self.assertIn("NOT EXISTS (", migration)
        self.assertTrue(consolidated.rstrip().endswith(migration.rstrip()),
                        "greenfield bootstrap must mirror the migration without drift")

    def test_production_like_startup_reuses_existing_sql_immutability_probe(self):
        probe = (ROOT / "ArchLucid.Host.Core/Startup/Validation/Rules/"
                 "SqlSealedEvidenceImmutabilityRules.cs").read_text()
        self.assertIn('("dbo.RemediationInstances", "DELETE")', probe)
        self.assertIn('("dbo.RemediationEvidence", "UPDATE")', probe)
        self.assertIn('("dbo.RemediationEvidence", "DELETE")', probe)
        self.assertIn("SqlDatabaseImmutabilityProbeHelpers.HasDenyPermission", probe)
        self.assertIn("SqlDatabaseImmutabilityProbeHelpers.HasEffectivePermission", probe)
        self.assertIn("migration 426", probe)

    def test_real_sql_regression_impersonates_non_owner_app_user(self):
        test = (ROOT / "ArchLucid.Persistence.Tests/Sql/"
                "RemediationRoleWritePermissionsSqlIntegrationTests.cs").read_text()
        self.assertIn("SqlServerPersistenceFixture", test)
        self.assertIn('InitialCatalog.Should().Contain("Test"', test)
        self.assertIn("426_RemediationRoleWritePermissions.sql", test)
        self.assertIn("EXECUTE AS USER =", test)
        self.assertIn('("dbo.RemediationInstances", "UPDATE")', test)
        self.assertIn('("dbo.RemediationEvidence", "INSERT")', test)
        self.assertIn("REVERT;", test)

    def test_sql_implements_scoped_update(self):
        source = (ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs").read_text()
        method = source.split("public async Task UpdateInstanceInScopeAsync(", 1)[1].split("public async Task<RemediationInstanceRecord?>", 1)[0]
        for token in ("WHERE TenantId = @TenantId", "AND WorkspaceId = @WorkspaceId", "AND ProjectId = @ProjectId", "AND InstanceId = @InstanceId"):
            self.assertIn(token, method)

if __name__ == "__main__":
    unittest.main()
