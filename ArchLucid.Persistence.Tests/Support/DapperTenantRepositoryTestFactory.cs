using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tenancy;

using ArchLucid.Persistence.Tests;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Builds <see cref="DapperTenantRepository" /> for SQL integration tests in the default <see cref="SqlTopologyMode.SingleCatalog" /> posture.
/// </summary>
internal static class DapperTenantRepositoryTestFactory
{
    public static DapperTenantRepository CreateForSingleCatalogIntegration(TestSqlConnectionFactory tenantPlaneFactory)
    {
        ArgumentNullException.ThrowIfNull(tenantPlaneFactory);

        ISystemSqlConnectionFactory system = new DelegatingSystemSqlConnectionFactory(tenantPlaneFactory);
        IOptionsMonitor<SqlTopologyOptions> topology = new StaticOptionsMonitor<SqlTopologyOptions>(
            new SqlTopologyOptions { Mode = SqlTopologyMode.SingleCatalog });

        ITenantDatabaseBindingRepository bindings = new DapperTenantDatabaseBindingRepository(system);
        IMemoryCache cache = new MemoryCache(new MemoryCacheOptions());
        string securedCatalog =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(tenantPlaneFactory.ConnectionString);
        IOptionsMonitor<ArchLucidPersistenceOptions> persistence =
            new StaticOptionsMonitor<ArchLucidPersistenceOptions>(new ArchLucidPersistenceOptions());
        TenantDatabaseResolver resolver =
            new(bindings, cache, topology, persistence, securedCatalog);

        return new DapperTenantRepository(
            system,
            tenantPlaneFactory,
            topology,
            bindings,
            resolver);
    }

    /// <summary>
    ///     Same physical catalog as <paramref name="tenantPlaneFactory" />, but <see cref="SqlTopologyMode.SystemWithPerTenantCatalogs" />
    ///     so repository code paths that fan out bindings / dual suspend hit real SQL without a second database.
    /// </summary>
    public static DapperTenantRepository CreateForPerTenantCatalogSameDatabaseIntegration(TestSqlConnectionFactory tenantPlaneFactory)
    {
        ArgumentNullException.ThrowIfNull(tenantPlaneFactory);

        string secured =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(tenantPlaneFactory.ConnectionString);
        SqlConnectionStringBuilder builder = new(secured);
        string logicalDatabaseName = builder.InitialCatalog;

        if (string.IsNullOrWhiteSpace(logicalDatabaseName))
            logicalDatabaseName = SqlServerPersistenceFixture.DefaultTestDatabaseName;

        builder.InitialCatalog = string.Empty;
        string templateConnectionString = builder.ConnectionString;

        ISystemSqlConnectionFactory system = new DelegatingSystemSqlConnectionFactory(tenantPlaneFactory);
        IOptionsMonitor<SqlTopologyOptions> topology = new StaticOptionsMonitor<SqlTopologyOptions>(
            new SqlTopologyOptions
            {
                Mode = SqlTopologyMode.SystemWithPerTenantCatalogs,
                TenantCatalogConnectionStringTemplate = templateConnectionString,
                TenantBindingCacheSeconds = 60,
            });

        ITenantDatabaseBindingRepository bindings = new DapperTenantDatabaseBindingRepository(system);
        IMemoryCache cache = new MemoryCache(new MemoryCacheOptions());
        IOptionsMonitor<ArchLucidPersistenceOptions> persistence =
            new StaticOptionsMonitor<ArchLucidPersistenceOptions>(new ArchLucidPersistenceOptions());
        TenantDatabaseResolver resolver = new(bindings, cache, topology, persistence, secured);

        return new DapperTenantRepository(
            system,
            tenantPlaneFactory,
            topology,
            bindings,
            resolver);
    }

    /// <summary>
    ///     Inserts / activates <c>dbo.TenantDatabaseBindings</c> for <see cref="SqlTopologyMode.SystemWithPerTenantCatalogs" /> tests against a single catalog.
    /// </summary>
    public static async Task EnsureActiveBindingForCurrentCatalogAsync(
        TestSqlConnectionFactory tenantPlaneFactory,
        Guid tenantId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(tenantPlaneFactory);

        ISystemSqlConnectionFactory system = new DelegatingSystemSqlConnectionFactory(tenantPlaneFactory);
        string secured =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(tenantPlaneFactory.ConnectionString);
        SqlConnectionStringBuilder builder = new(secured);
        string logicalDatabaseName = builder.InitialCatalog;

        if (string.IsNullOrWhiteSpace(logicalDatabaseName))
            logicalDatabaseName = SqlServerPersistenceFixture.DefaultTestDatabaseName;

        DapperTenantDatabaseBindingRepository repo = new(system);
        await repo.UpsertPendingAsync(tenantId, logicalDatabaseName, ct);
        await repo.MarkActiveAsync(tenantId, ct);
    }

    private sealed class DelegatingSystemSqlConnectionFactory(ISqlConnectionFactory inner) : ISystemSqlConnectionFactory
    {
        private readonly ISqlConnectionFactory _inner =
            inner ?? throw new ArgumentNullException(nameof(inner));

        public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default) =>
            _inner.CreateOpenConnectionAsync(cancellationToken);
    }

    private sealed class StaticOptionsMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        private readonly T _value = value ?? throw new ArgumentNullException(nameof(value));

        public T CurrentValue => _value;

        public T Get(string? name) => _value;

        public IDisposable OnChange(Action<T, string?> listener) => new EmptyDisposable();
    }

    private sealed class EmptyDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }
}
