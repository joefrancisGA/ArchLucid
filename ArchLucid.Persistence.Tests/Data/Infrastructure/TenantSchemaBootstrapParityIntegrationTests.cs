using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;
using ArchLucid.TestSupport;

using Dapper;
using DbUp;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "SqlServerContainer")]
[Trait("Category", "SqlServerFreshSchema")]
[Trait("Suite", "Persistence")]
public sealed class TenantSchemaBootstrapParityIntegrationTests
{
    /// <summary>
    ///     Verifies that <c>ArchLucid.sql</c> runs end-to-end on a completely empty catalog with no prior DbUp
    ///     migrations.  This is the <em>per-tenant catalog greenfield</em> path: the system-plane has already run
    ///     <c>ArchLucid.System.sql</c> (which creates <c>dbo.Tenants</c>), but the tenant catalog starts empty.
    ///
    ///     Before the RC2 fix this test would fail with one of:
    ///     <list type="bullet">
    ///       <item>
    ///         <description>
    ///           <c>Invalid object name 'dbo.GovernanceApprovalRequests'</c> — the migration-058 index block ran
    ///           before the table existed (no DbUp 038 parity CREATE TABLE in the script).
    ///         </description>
    ///       </item>
    ///       <item>
    ///         <description>
    ///           <c>Foreign key 'FK_CommitRunIdempotency_Tenants' references invalid table 'dbo.Tenants'</c> —
    ///           <c>dbo.CommitRunIdempotency</c> was created before <c>dbo.Tenants</c> in script order.
    ///         </description>
    ///       </item>
    ///     </list>
    /// </summary>
    [SkippableFact]
    public void Tenant_bootstrap_script_succeeds_on_empty_catalog_without_prior_dbup()
    {
        string connectionString = CreateEphemeralCatalogConnectionStringOrSkip("GreenfieldBootstrapOnly");

        try
        {
            SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);

            // Deliberately do NOT run DatabaseMigrator.Run — this is the per-tenant catalog greenfield path.
            SqlConnectionFactory connectionFactory = new(connectionString);
            SqlSchemaBootstrapper bootstrapper = new(
                connectionFactory,
                PersistenceScriptPaths.ResolveTenantScriptPath());

            Action bootstrap = () => bootstrapper.EnsureSchemaAsync(CancellationToken.None).GetAwaiter().GetResult();

            bootstrap.Should().NotThrow(
                "ArchLucid.sql must complete on a fresh empty catalog with no prior DbUp migrations");

            using SqlConnection connection = new(connectionString);
            connection.Open();

            AssertTableExists(connection, "dbo.GovernanceApprovalRequests");
            AssertTableExists(connection, "dbo.GovernancePromotionRecords");
            AssertTableExists(connection, "dbo.GovernanceEnvironmentActivations");
            AssertTableExists(connection, "dbo.CommitRunIdempotency");

            // Verify governance tables have the required columns added by migration-118 parity.
            AssertColumnExists(connection, "dbo.GovernanceApprovalRequests", "TenantId");
            AssertColumnExists(connection, "dbo.GovernancePromotionRecords",  "TenantId");
            AssertColumnExists(connection, "dbo.GovernanceEnvironmentActivations", "TenantId");
        }
        catch (Exception ex)
        {
            Skip.If(true, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason + " " + ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
    }

    /// <summary>
    ///     Verifies that running <c>ArchLucid.sql</c> does not add <c>FK_CommitRunIdempotency_Tenants</c> or
    ///     <c>FK_ProjectRoleAssignments_Tenants</c> when <c>dbo.Tenants</c> is absent — the
    ///     <c>SystemWithPerTenantCatalogs</c> invariant.
    ///     The test creates a fresh catalog, runs the full bootstrap, then drops <c>dbo.Tenants</c> and runs
    ///     bootstrap again to simulate the re-entrant per-tenant path.
    /// </summary>
    [SkippableFact]
    public void Bootstrap_script_does_not_create_Tenants_FK_when_dbo_Tenants_is_absent()
    {
        string connectionString = CreateEphemeralCatalogConnectionStringOrSkip("NoTenantsTableFk");

        try
        {
            SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);

            SqlConnectionFactory connectionFactory = new(connectionString);
            SqlSchemaBootstrapper bootstrapper = new(
                connectionFactory,
                PersistenceScriptPaths.ResolveTenantScriptPath());

            bootstrapper.EnsureSchemaAsync(CancellationToken.None).GetAwaiter().GetResult();

            using SqlConnection connection = new(connectionString);
            connection.Open();

            // Drop dbo.Tenants to simulate a pure tenant catalog (all FKs to it must first be dropped).
            DropAllForeignKeysReferencingTenants(connection);

            using SqlCommand dropTenants = connection.CreateCommand();
            dropTenants.CommandText = "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL DROP TABLE dbo.Tenants;";
            dropTenants.ExecuteNonQuery();

            // Running bootstrap again on a catalog without dbo.Tenants must not throw.
            Action rerun = () => bootstrapper.EnsureSchemaAsync(CancellationToken.None).GetAwaiter().GetResult();
            rerun.Should().NotThrow(
                "all FK references to dbo.Tenants in ArchLucid.sql must be guarded with OBJECT_ID(N'dbo.Tenants') IS NOT NULL");

            // Verify no FK to the now-absent dbo.Tenants was (re)created.
            AssertNoForeignKeyToTenants(connection, "dbo.CommitRunIdempotency", "FK_CommitRunIdempotency_Tenants");
            AssertNoForeignKeyToTenants(connection, "dbo.ProjectRoleAssignments", "FK_ProjectRoleAssignments_Tenants");
            AssertNoForeignKeyToTenants(connection, "dbo.GovernanceApprovalRequests",   "FK_GovernanceApprovalRequests_Tenants");
            AssertNoForeignKeyToTenants(connection, "dbo.GovernancePromotionRecords",   "FK_GovernancePromotionRecords_Tenants");
            AssertNoForeignKeyToTenants(connection, "dbo.GovernanceEnvironmentActivations", "FK_GovernanceEnvironmentActivations_Tenants");
        }
        catch (Exception ex)
        {
            Skip.If(true, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason + " " + ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
    }

    [SkippableFact]
    public void DbUp_only_and_DbUp_plus_bootstrap_pass_the_same_tenant_sentinel_manifest()
    {
        string dbUpOnlyConnectionString = CreateEphemeralCatalogConnectionStringOrSkip("DbUpOnly");
        string bootstrapConnectionString = CreateEphemeralCatalogConnectionStringOrSkip("DbUpBootstrap");

        try
        {
            SqlServerTestCatalogCommands.EnsureCatalogExists(dbUpOnlyConnectionString);
            SqlServerTestCatalogCommands.EnsureCatalogExists(bootstrapConnectionString);

            DatabaseMigrator.Run(dbUpOnlyConnectionString);
            DatabaseMigrator.Run(bootstrapConnectionString);

            SqlConnectionFactory connectionFactory = new(bootstrapConnectionString);
            SqlSchemaBootstrapper bootstrapper = new(
                connectionFactory,
                PersistenceScriptPaths.ResolveTenantScriptPath());

            bootstrapper.EnsureSchemaAsync(CancellationToken.None).GetAwaiter().GetResult();

            SchemaDriftVerifier.VerifyOrThrow(dbUpOnlyConnectionString, TenantSchemaSentinelManifest.Expectations);
            SchemaDriftVerifier.VerifyOrThrow(bootstrapConnectionString, TenantSchemaSentinelManifest.Expectations);
        }
        catch (Exception ex)
        {
            Skip.If(true, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason + " " + ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
    }

    [SkippableFact]
    public void System_DbUp_and_system_bootstrap_pass_system_sentinel_manifest()
    {
        string connectionString = CreateEphemeralCatalogConnectionStringOrSkip("SystemPlane");

        try
        {
            SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
            DatabaseMigrator.RunSystem(connectionString);

            SqlConnectionFactory connectionFactory = new(connectionString);
            SqlSchemaBootstrapper bootstrapper = new(
                connectionFactory,
                PersistenceScriptPaths.ResolveSystemScriptPath());

            bootstrapper.EnsureSchemaAsync(CancellationToken.None).GetAwaiter().GetResult();

            SchemaDriftVerifier.VerifyOrThrow(connectionString, SystemSchemaSentinelManifest.Expectations);
        }
        catch (Exception ex)
        {
            Skip.If(true, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason + " " + ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
    }

    [SkippableFact]
    public async Task System_migrations_alone_support_tenant_directory_lookup()
    {
        string connectionString = CreateEphemeralCatalogConnectionStringOrSkip("SystemDirectory");
        SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
        try
        {
            DatabaseMigrator.RunSystem(connectionString);
            Guid id = Guid.NewGuid();
            const string slug = "system-directory";
            await using (SqlConnection connection = new(connectionString))
            {
                await connection.OpenAsync();
                await connection.ExecuteAsync(
                    "INSERT INTO dbo.Tenants (Id, Name, Slug, Tier) VALUES (@Id, @Name, @Slug, @Tier)",
                    new { Id = id, Name = "System directory tenant", Slug = slug, Tier = "Standard" });
            }

            DapperTenantRepository repository =
                DapperTenantRepositoryTestFactory.CreateForPerTenantCatalogSameDatabaseIntegration(
                    new TestSqlConnectionFactory(connectionString));
            TenantRecord tenant = Assert.IsType<TenantRecord>(
                await repository.GetByIdFromControlPlaneCatalogAsync(id, CancellationToken.None));

            Assert.Equal(id, tenant.Id);
            Assert.Equal(slug, tenant.Slug);
            Assert.Equal(TenantTier.Standard, tenant.Tier);
            Assert.Equal(TenantDataRegions.Default, tenant.DataRegion);
            Assert.Equal(0, tenant.TrialArchitecturePreseedAttemptCount);
            Assert.Null(tenant.LegalHoldUntilUtc);
            Assert.Null(await repository.GetByIdFromControlPlaneCatalogAsync(Guid.NewGuid(), CancellationToken.None));
        }
        finally
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(connectionString);
        }
    }

    [SkippableFact]
    public Task Migration_006_backfills_only_offboarded_tenants_when_request_column_is_missing() =>
        AssertPopulatedDirectoryUpgradeAsync(hasRequestColumn: false);

    [SkippableFact]
    public Task Migration_006_preserves_recorded_erasure_request_and_legal_hold() =>
        AssertPopulatedDirectoryUpgradeAsync(hasRequestColumn: true);

    private static async Task AssertPopulatedDirectoryUpgradeAsync(bool hasRequestColumn)
    {
        var assembly = typeof(DatabaseMigrator).Assembly;
        string migration006 = assembly.GetManifestResourceNames().Single(
            n => n.EndsWith(".Migrations.System.006_TenantDirectoryProjection.sql", StringComparison.Ordinal));
        string connectionString = CreateEphemeralCatalogConnectionStringOrSkip("SystemDirectoryUpgrade");
        SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
        try
        {
            // Journal 001 through 005 as an existing deployment would.
            var baseline = DeployChanges.To.SqlDatabase(connectionString)
                .WithScriptsEmbeddedInAssembly(assembly,
                    name => SqlMigrationPlanes.IsSystemPlaneScript(name) && string.CompareOrdinal(name, migration006) < 0)
                .WithTransactionPerScript().Build().PerformUpgrade();
            Assert.True(baseline.Successful, baseline.Error?.ToString());

            Guid offboardedId = Guid.NewGuid();
            Guid activeId = Guid.NewGuid();
            DateTimeOffset offboarded = new DateTimeOffset(2026, 3, 9, 10, 15, 48, TimeSpan.FromHours(-4)).AddTicks(1234567);
            DateTimeOffset requested = offboarded.AddDays(-2);
            DateTimeOffset holdUntil = offboarded.AddMonths(3);
            await using (SqlConnection connection = new(connectionString))
            {
                await connection.OpenAsync();
                await connection.ExecuteAsync("""
                    ALTER TABLE dbo.Tenants ADD OffboardedUtc DATETIMEOFFSET(7) NULL,
                        LegalHoldUntilUtc DATETIMEOFFSET(7) NULL, LegalHoldReason NVARCHAR(500) NULL,
                        DataRegion NVARCHAR(64) NOT NULL DEFAULT N'default';
                    """);
                await connection.ExecuteAsync("""
                    INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, OffboardedUtc, LegalHoldUntilUtc, LegalHoldReason, DataRegion)
                    VALUES (@offboardedId, N'Former tenant', N'former', N'Standard', @offboarded, @holdUntil, N'Retain records', N'westeurope'),
                           (@activeId, N'Active tenant', N'active', N'Standard', NULL, NULL, NULL, N'eastus');
                    """, new { offboardedId, activeId, offboarded, holdUntil });
                if (hasRequestColumn)
                {
                    await connection.ExecuteAsync("ALTER TABLE dbo.Tenants ADD TenantErasureRequestedUtc DATETIMEOFFSET(7) NULL;");
                    await connection.ExecuteAsync("UPDATE dbo.Tenants SET TenantErasureRequestedUtc = @requested WHERE Id = @offboardedId;",
                        new { requested, offboardedId });
                }
            }

            var repository = DapperTenantRepositoryTestFactory.CreateForPerTenantCatalogSameDatabaseIntegration(
                new TestSqlConnectionFactory(connectionString));
            async Task AssertDirectoryValuesAsync()
            {
                TenantRecord former = Assert.IsType<TenantRecord>(
                    await repository.GetByIdFromControlPlaneCatalogAsync(offboardedId, CancellationToken.None));
                Assert.True(former.OffboardedUtc?.EqualsExact(offboarded) == true);
                Assert.True(former.TenantErasureRequestedUtc?.EqualsExact(hasRequestColumn ? requested : offboarded) == true);
                Assert.True(former.LegalHoldUntilUtc?.EqualsExact(holdUntil) == true);
                Assert.Equal("Retain records", former.LegalHoldReason);
                Assert.Equal("westeurope", former.DataRegion);

                TenantRecord active = Assert.IsType<TenantRecord>(
                    await repository.GetByIdFromControlPlaneCatalogAsync(activeId, CancellationToken.None));
                Assert.Null(active.OffboardedUtc);
                Assert.Null(active.TenantErasureRequestedUtc);
                Assert.Null(active.LegalHoldUntilUtc);
                Assert.Equal("eastus", active.DataRegion);
            }

            DatabaseMigrator.RunSystem(connectionString);
            await AssertDirectoryValuesAsync();

            // DbUp would normally skip a journaled script. Replay only 006 against the same populated catalog.
            var replay = DeployChanges.To.SqlDatabase(connectionString)
                .WithScriptsEmbeddedInAssembly(assembly, name => name == migration006)
                .WithTransactionPerScript().JournalTo(new DbUp.Helpers.NullJournal())
                .Build().PerformUpgrade();
            Assert.True(replay.Successful, replay.Error?.ToString());
            await AssertDirectoryValuesAsync();
        }
        finally
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(connectionString);
        }
    }

    private static string CreateEphemeralCatalogConnectionStringOrSkip(string label)
    {
        try
        {
            string name = "ArchLucidSchemaParity" + label + Guid.NewGuid().ToString("N");

            return SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(name);
        }
        catch (InvalidOperationException ex)
        {
            Skip.If(true, ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
    }

    private static void AssertTableExists(SqlConnection connection, string qualifiedName)
    {
        using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText = $"SELECT OBJECT_ID(N'{qualifiedName}', N'U');";
        object? result = cmd.ExecuteScalar();
        result.Should().NotBeNull().And.NotBe(DBNull.Value,
            $"table {qualifiedName} must exist after ArchLucid.sql bootstrap");
    }

    private static void AssertColumnExists(SqlConnection connection, string qualifiedTable, string columnName)
    {
        using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText = $"SELECT COL_LENGTH(N'{qualifiedTable}', N'{columnName}');";
        object? result = cmd.ExecuteScalar();
        result.Should().NotBe(DBNull.Value,
            $"column {qualifiedTable}.{columnName} must exist after ArchLucid.sql bootstrap");
    }

    private static void AssertNoForeignKeyToTenants(SqlConnection connection, string qualifiedTable, string fkName)
    {
        using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText = $"""
            SELECT COUNT(1) FROM sys.foreign_keys
            WHERE name = N'{fkName}'
              AND parent_object_id = OBJECT_ID(N'{qualifiedTable}');
            """;
        object? result = cmd.ExecuteScalar();
        Convert.ToInt32(result).Should().Be(0,
            $"{fkName} must not exist on {qualifiedTable} when dbo.Tenants is absent");
    }

    /// <summary>
    ///     Drops all foreign keys in the current database that reference <c>dbo.Tenants</c> so the table can be
    ///     dropped without a referential-integrity error.  Used only in test cleanup — never in production.
    /// </summary>
    private static void DropAllForeignKeysReferencingTenants(SqlConnection connection)
    {
        const string findFksSql = """
            SELECT
                QUOTENAME(OBJECT_SCHEMA_NAME(fk.parent_object_id)) + N'.' +
                QUOTENAME(OBJECT_NAME(fk.parent_object_id))          AS ParentTable,
                QUOTENAME(fk.name)                                    AS FkName
            FROM sys.foreign_keys AS fk
            INNER JOIN sys.foreign_key_columns AS fkc
                ON fk.object_id = fkc.constraint_object_id
            WHERE fkc.referenced_object_id = OBJECT_ID(N'dbo.Tenants');
            """;

        List<(string ParentTable, string FkName)> keys = [];

        using (SqlCommand findCmd = connection.CreateCommand())
        {
            findCmd.CommandText = findFksSql;

            using SqlDataReader reader = findCmd.ExecuteReader();

            while (reader.Read())
                keys.Add((reader.GetString(0), reader.GetString(1)));
        }

        foreach ((string parentTable, string fkName) in keys)
        {
            using SqlCommand dropCmd = connection.CreateCommand();
            dropCmd.CommandText = $"ALTER TABLE {parentTable} DROP CONSTRAINT {fkName};";
            dropCmd.ExecuteNonQuery();
        }
    }
}
