using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Tenancy;

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
        TenantDatabaseResolver resolver =
            new(bindings, cache, topology, tenantPlaneFactory.ConnectionString);

        return new DapperTenantRepository(
            system,
            tenantPlaneFactory,
            topology,
            bindings,
            resolver);
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
