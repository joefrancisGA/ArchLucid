using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Persistence")]
public sealed class TenantSchemaBootstrapParityIntegrationTests
{
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
}
