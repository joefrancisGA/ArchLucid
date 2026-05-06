using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tenancy;

using ArchLucid.TestSupport;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

using Xunit;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Validates system vs tenant DbUp planes and <see cref="ScopedRoutingSqlConnectionFactory" /> routing against real SQL.
/// </summary>
[Trait("Category", "SqlServerContainer")]
public sealed class SqlTopologyPlaneIsolationSqlIntegrationTests
{
    [SkippableFact]
    public async Task System_migrations_exclude_product_tables_tenant_migrations_exclude_control_plane_bindings_table()
    {
        PreparedTopologyDatabases d = PrepareTopologyDatabasesOrSkip();

        await TableShouldExistAsync(d.SystemCatalogConnectionString, "TenantDatabaseBindings", expected: true);
        // Tenant baseline + DbUp define dbo.Runs; system plane excludes that product DDL (legacy dbo.ArchitectureRuns was dropped in 049).
        await TableShouldExistAsync(d.SystemCatalogConnectionString, "Runs", expected: false);

        await TableShouldExistAsync(d.TenantCatalogConnectionString, "Runs", expected: true);
        await TableShouldExistAsync(d.TenantCatalogConnectionString, "TenantDatabaseBindings", expected: false);
    }

    [SkippableFact]
    public async Task Scoped_routing_opens_system_catalog_without_tenant_scope_and_bound_tenant_catalog_when_scoped()
    {
        PreparedTopologyDatabases d = PrepareTopologyDatabasesOrSkip();

        SqlConnectionStringBuilder tenantBuilder = new(d.TenantCatalogConnectionString);
        string logicalDbName = tenantBuilder.InitialCatalog;

        await SeedSystemTenantAndBindingAsync(
            d.SystemCatalogConnectionString,
            d.TenantId,
            logicalDbName);

        SqlTopologyOptions topology = new()
        {
            Mode = SqlTopologyMode.SystemWithPerTenantCatalogs,
            TenantCatalogConnectionStringTemplate = BuildMasterTemplateConnectionString(tenantBuilder),
            TenantBindingCacheSeconds = 30,
        };

        IOptionsMonitor<SqlTopologyOptions> topologyMonitor = new StubOptionsMonitor(topology);
        ISystemSqlConnectionFactory systemFactory =
            new DedicatedSystemSqlConnectionFactory(d.SystemCatalogConnectionString);
        ITenantDatabaseBindingRepository bindings = new DapperTenantDatabaseBindingRepository(systemFactory);
        IMemoryCache cache = new MemoryCache(new MemoryCacheOptions());
        TenantDatabaseResolver resolver =
            new(bindings, cache, topologyMonitor, d.SystemCatalogConnectionString);

        ScopedRoutingSqlConnectionFactory routingWithTenant = new(
            d.SystemCatalogConnectionString,
            systemFactory,
            resolver,
            new FixedScopeContextProvider(d.TenantId),
            topologyMonitor);

        await using (SqlConnection tenantConn = await routingWithTenant.CreateOpenConnectionAsync(CancellationToken.None))
        {
            tenantConn.Database.Should().Be(logicalDbName);
        }

        ScopedRoutingSqlConnectionFactory routingSystem = new(
            d.SystemCatalogConnectionString,
            systemFactory,
            resolver,
            new FixedScopeContextProvider(Guid.Empty),
            topologyMonitor);

        SqlConnectionStringBuilder systemBuilder = new(d.SystemCatalogConnectionString);
        await using (SqlConnection systemConn = await routingSystem.CreateOpenConnectionAsync(CancellationToken.None))
        {
            systemConn.Database.Should().Be(systemBuilder.InitialCatalog);
        }
    }

    private sealed record PreparedTopologyDatabases(
        string SystemCatalogConnectionString,
        string TenantCatalogConnectionString,
        Guid TenantId);

    private static PreparedTopologyDatabases PrepareTopologyDatabasesOrSkip()
    {
        Guid tenantId = Guid.NewGuid();

        string sysName = "ArchLucidTopoSys" + Guid.NewGuid().ToString("N");
        string tntName = "ArchLucidTopoTnt" + Guid.NewGuid().ToString("N");

        string systemCatalogConnectionString;
        string tenantCatalogConnectionString;

        try
        {
            systemCatalogConnectionString =
                SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(sysName);
            tenantCatalogConnectionString =
                SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(tntName);
        }
        catch (InvalidOperationException ex)
        {
            Skip.If(true, ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }

        try
        {
            SqlServerTestCatalogCommands.EnsureCatalogExists(systemCatalogConnectionString);
            SqlServerTestCatalogCommands.EnsureCatalogExists(tenantCatalogConnectionString);
            DatabaseMigrator.RunSystem(systemCatalogConnectionString);
            DatabaseMigrator.RunTenant(tenantCatalogConnectionString);
        }
        catch (Exception ex)
        {
            Skip.If(true, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason + " " + ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }

        return new PreparedTopologyDatabases(systemCatalogConnectionString, tenantCatalogConnectionString, tenantId);
    }

    private static async Task TableShouldExistAsync(string connectionString, string tableName, bool expected)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync(CancellationToken.None);
        int bit = await connection.QuerySingleAsync<int>(
            """
            SELECT CASE WHEN OBJECT_ID(@FullName, N'U') IS NULL THEN 0 ELSE 1 END;
            """,
            new { FullName = "dbo." + tableName });

        (bit != 0).Should().Be(expected, $"table {tableName} existence should be {expected}");
    }

    private static string BuildMasterTemplateConnectionString(SqlConnectionStringBuilder tenantBuilder)
    {
        SqlConnectionStringBuilder clone = new(tenantBuilder.ConnectionString)
        {
            InitialCatalog = "master",
        };

        return clone.ConnectionString;
    }

    private static async Task SeedSystemTenantAndBindingAsync(
        string systemCatalogConnectionString,
        Guid tenantId,
        string sqlLogicalDatabaseName)
    {
        await using SqlConnection connection = new(systemCatalogConnectionString);
        await connection.OpenAsync(CancellationToken.None);

        string slug = "topo-" + tenantId.ToString("N");

        await connection.ExecuteAsync(
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Id)
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier)
                VALUES (@Id, @Name, @Slug, N'Standard');
            """,
            new
            {
                Id = tenantId,
                Name = "topology routing tenant",
                Slug = slug,
            });

        DapperTenantDatabaseBindingRepository repo =
            new(new DedicatedSystemSqlConnectionFactory(systemCatalogConnectionString));

        await repo.UpsertPendingAsync(tenantId, sqlLogicalDatabaseName, CancellationToken.None);
        await repo.MarkActiveAsync(tenantId, CancellationToken.None);
    }

    private sealed class FixedScopeContextProvider(Guid tenantId) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope()
        {
            return new ScopeContext { TenantId = tenantId };
        }
    }

    private sealed class StubOptionsMonitor(SqlTopologyOptions value) : IOptionsMonitor<SqlTopologyOptions>
    {
        private readonly SqlTopologyOptions _value = value ?? throw new ArgumentNullException(nameof(value));

        public SqlTopologyOptions CurrentValue => _value;

        public SqlTopologyOptions Get(string? name) => _value;

        public IDisposable OnChange(Action<SqlTopologyOptions, string?> listener) => new EmptyDisposable();
    }

    private sealed class EmptyDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }
}
