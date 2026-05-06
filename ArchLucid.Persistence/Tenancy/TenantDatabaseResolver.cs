using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed class TenantDatabaseResolver : ITenantDatabaseResolver
{
    private const string CacheKeyPrefix = "ArchLucid:TenantSqlCs:";

    private readonly ITenantDatabaseBindingRepository _bindings;
    private readonly IMemoryCache _cache;
    private readonly string _singleCatalogConnectionString;
    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions;

    public TenantDatabaseResolver(
        ITenantDatabaseBindingRepository bindings,
        IMemoryCache cache,
        IOptionsMonitor<SqlTopologyOptions> topologyOptions,
        string singleCatalogConnectionString)
    {
        _bindings = bindings ?? throw new ArgumentNullException(nameof(bindings));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _topologyOptions = topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));
        ArgumentException.ThrowIfNullOrWhiteSpace(singleCatalogConnectionString);
        _singleCatalogConnectionString =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(singleCatalogConnectionString);
    }

    public void InvalidateCachedTenantConnectionString(Guid tenantId) =>
        _cache.Remove(CacheKeyPrefix + tenantId.ToString("D"));

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
}
