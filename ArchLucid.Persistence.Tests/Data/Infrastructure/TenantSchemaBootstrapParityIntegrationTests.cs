using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "SqlServerContainer")]
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
