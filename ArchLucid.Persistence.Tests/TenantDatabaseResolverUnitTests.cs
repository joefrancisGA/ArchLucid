using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantDatabaseResolverUnitTests
{
    [Fact]
    public async Task SingleCatalog_ignores_binding_repository_and_returns_primary_catalog_connection_string()
    {
        ITenantDatabaseBindingRepository bindings = new ThrowingTenantDatabaseBindingRepository();
        IMemoryCache cache = new MemoryCache(new MemoryCacheOptions());
        IOptionsMonitor<SqlTopologyOptions> topology =
            new StubOptionsMonitor<SqlTopologyOptions>(new SqlTopologyOptions { Mode = SqlTopologyMode.SingleCatalog });
        const string primary =
            "Server=localhost;Database=SharedCatalog;User Id=x;Password=y;Encrypt=True;TrustServerCertificate=True;";
        string normalizedPrimary = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(primary);
        TenantDatabaseResolver resolver = new(bindings, cache, topology, primary);

        string resolved =
            await resolver.ResolveTenantConnectionStringAsync(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CancellationToken.None);

        resolved.Should().Be(normalizedPrimary);
    }

    [Fact]
    public async Task PerTenant_resolves_template_with_bound_logical_database_name()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ITenantDatabaseBindingRepository bindings = new RecordingBindingsRepository(
            new TenantDatabaseBindingRecord
            {
                TenantId = tenantId,
                SqlLogicalDatabaseName = "TenantCatalogA",
                ProvisioningState = TenantDatabaseProvisioningState.Active,
            });

        IMemoryCache cache = new MemoryCache(new MemoryCacheOptions());
        const string template = "Server=localhost;Database=__placeholder;User Id=x;Password=y;Encrypt=True;TrustServerCertificate=True;";
        IOptionsMonitor<SqlTopologyOptions> topology = new StubOptionsMonitor<SqlTopologyOptions>(
            new SqlTopologyOptions
            {
                Mode = SqlTopologyMode.SystemWithPerTenantCatalogs,
                TenantCatalogConnectionStringTemplate = template,
                TenantBindingCacheSeconds = 60,
            });

        const string primary =
            "Server=localhost;Database=SystemCatalog;User Id=x;Password=y;Encrypt=True;TrustServerCertificate=True;";
        TenantDatabaseResolver resolver = new(bindings, cache, topology, primary);

        string resolved = await resolver.ResolveTenantConnectionStringAsync(tenantId, CancellationToken.None);

        SqlConnectionStringBuilder builder = new(resolved);
        builder.InitialCatalog.Should().Be("TenantCatalogA");
    }

    private sealed class ThrowingTenantDatabaseBindingRepository : ITenantDatabaseBindingRepository
    {
        public Task<TenantDatabaseBindingRecord?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Bindings must not load in single-catalog mode.");

        public Task<IReadOnlyList<TenantDatabaseBindingRecord>> ListBindingsWithStateAsync(
            TenantDatabaseProvisioningState state,
            CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Bindings must not load in single-catalog mode.");

        public Task UpsertPendingAsync(Guid tenantId, string sqlLogicalDatabaseName, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Bindings must not load in single-catalog mode.");

        public Task MarkActiveAsync(Guid tenantId, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Bindings must not load in single-catalog mode.");

        public Task MarkFailedAsync(Guid tenantId, string errorMessage, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Bindings must not load in single-catalog mode.");
    }

    private sealed class RecordingBindingsRepository(TenantDatabaseBindingRecord row) : ITenantDatabaseBindingRepository
    {
        public Task<TenantDatabaseBindingRecord?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken) =>
            Task.FromResult(row.TenantId == tenantId ? row : null);

        public Task<IReadOnlyList<TenantDatabaseBindingRecord>> ListBindingsWithStateAsync(
            TenantDatabaseProvisioningState state,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<TenantDatabaseBindingRecord>>([]);

        public Task UpsertPendingAsync(Guid tenantId, string sqlLogicalDatabaseName, CancellationToken cancellationToken) =>
            Task.CompletedTask;

        public Task MarkActiveAsync(Guid tenantId, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task MarkFailedAsync(Guid tenantId, string errorMessage, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }

    private sealed class StubOptionsMonitor<T>(T value) : IOptionsMonitor<T>
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
