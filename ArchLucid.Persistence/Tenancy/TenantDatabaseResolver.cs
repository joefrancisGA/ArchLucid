using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed class TenantDatabaseResolver : ITenantDatabaseResolver
{
    private const string CacheKeyPrefix = "ArchLucid:TenantSqlCs:";
    private const string ReadOnlyCacheKeyPrefix = "ArchLucid:TenantSqlReadCs:";

    private readonly ITenantDatabaseBindingRepository _bindings;
    private readonly IMemoryCache _cache;
    private readonly string _singleCatalogConnectionString;
    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions;
    private readonly IOptionsMonitor<ArchLucidPersistenceOptions> _persistenceOptions;

    public TenantDatabaseResolver(
        ITenantDatabaseBindingRepository bindings,
        IMemoryCache cache,
        IOptionsMonitor<SqlTopologyOptions> topologyOptions,
        IOptionsMonitor<ArchLucidPersistenceOptions> persistenceOptions,
        string singleCatalogConnectionString)
    {
        _bindings = bindings ?? throw new ArgumentNullException(nameof(bindings));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _topologyOptions = topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));
        _persistenceOptions = persistenceOptions ?? throw new ArgumentNullException(nameof(persistenceOptions));
        ArgumentException.ThrowIfNullOrWhiteSpace(singleCatalogConnectionString);
        _singleCatalogConnectionString =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(singleCatalogConnectionString);
    }

    public void InvalidateCachedTenantConnectionString(Guid tenantId)
    {
        string key = tenantId.ToString("D");
        _cache.Remove(CacheKeyPrefix + key);
        _cache.Remove(ReadOnlyCacheKeyPrefix + key);
    }

    public async Task<string> ResolveTenantConnectionStringAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode == SqlTopologyMode.SingleCatalog)
            return _singleCatalogConnectionString;

        string cacheKey = CacheKeyPrefix + tenantId.ToString("D");

        if (_cache.TryGetValue(cacheKey, out string? cached) && !string.IsNullOrWhiteSpace(cached))
            return cached;

        TenantDatabaseBindingRecord? row = await _bindings.GetByTenantIdAsync(tenantId, cancellationToken);

        if (row is null || row.ProvisioningState != TenantDatabaseProvisioningState.Active)

            throw new InvalidOperationException(
                "Tenant SQL catalog binding is missing or not active for tenant '" + tenantId.ToString("D") + "'.");

        if (string.IsNullOrWhiteSpace(snapshot.TenantCatalogConnectionStringTemplate))

            throw new InvalidOperationException(
                "ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate is required when SqlTopology:Mode is SystemWithPerTenantCatalogs.");

        string resolved = SqlTenantCatalogConnectionStringFactory.FromTemplate(
            snapshot.TenantCatalogConnectionStringTemplate.Trim(),
            row.SqlLogicalDatabaseName);

        int seconds = Math.Clamp(snapshot.TenantBindingCacheSeconds, 1, 600);
        _cache.Set(cacheKey, resolved, TimeSpan.FromSeconds(seconds));

        return resolved;
    }

    public async Task<string?> TryResolveReadOnlyConnectionStringAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        string? template = _persistenceOptions.CurrentValue.ReadOnlyConnectionStringTemplate?.Trim();

        if (string.IsNullOrEmpty(template))
            return null;

        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode == SqlTopologyMode.SingleCatalog)
            return SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(template);

        string cacheKey = ReadOnlyCacheKeyPrefix + tenantId.ToString("D");

        if (_cache.TryGetValue(cacheKey, out string? cached) && !string.IsNullOrWhiteSpace(cached))
            return cached;

        TenantDatabaseBindingRecord? row = await _bindings.GetByTenantIdAsync(tenantId, cancellationToken);

        if (row is null || row.ProvisioningState != TenantDatabaseProvisioningState.Active)

            throw new InvalidOperationException(
                "Tenant SQL catalog binding is missing or not active for tenant '" + tenantId.ToString("D") + "'.");

        if (string.IsNullOrWhiteSpace(snapshot.TenantCatalogConnectionStringTemplate))

            throw new InvalidOperationException(
                "ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate is required when SqlTopology:Mode is SystemWithPerTenantCatalogs.");

        string resolved = SqlTenantCatalogConnectionStringFactory.FromTemplate(template, row.SqlLogicalDatabaseName);
        int seconds = Math.Clamp(snapshot.TenantBindingCacheSeconds, 1, 600);
        _cache.Set(cacheKey, resolved, TimeSpan.FromSeconds(seconds));

        return resolved;
    }
}
