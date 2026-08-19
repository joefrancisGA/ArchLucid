using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Routes to the system catalog when topology is per-tenant and scope tenant id is empty; otherwise opens the tenant
///     catalog (single-catalog mode always uses the primary connection string).
/// </summary>
public sealed class ScopedRoutingSqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string _singleCatalogConnectionString;
    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory;
    private readonly ITenantDatabaseResolver _tenantDatabaseResolver;
    private readonly IScopeContextProvider _scopeContextProvider;
    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions;

    public ScopedRoutingSqlConnectionFactory(
        string singleCatalogConnectionString,
        ISystemSqlConnectionFactory systemSqlConnectionFactory,
        ITenantDatabaseResolver tenantDatabaseResolver,
        IScopeContextProvider scopeContextProvider,
        IOptionsMonitor<SqlTopologyOptions> topologyOptions,
        bool enforceServerCertificateTrust = false)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(singleCatalogConnectionString);
        _singleCatalogConnectionString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(
            singleCatalogConnectionString,
            enforceServerCertificateTrust);
        _systemSqlConnectionFactory =
            systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));
        _tenantDatabaseResolver =
            tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
        _topologyOptions = topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));
    }

    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode == SqlTopologyMode.SingleCatalog)
        {
            SqlConnection single = new(_singleCatalogConnectionString);
            await single.OpenAsync(cancellationToken);
            return single;
        }

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
            return await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string tenantCs =
            await _tenantDatabaseResolver.ResolveTenantConnectionStringAsync(tenantId, cancellationToken);

        EnsureTenantScopedRequestDoesNotTargetSystemCatalog(tenantId, tenantCs);

        SqlConnection tenant = new(tenantCs);
        await tenant.OpenAsync(cancellationToken);
        return tenant;
    }

    private void EnsureTenantScopedRequestDoesNotTargetSystemCatalog(Guid tenantId, string tenantConnectionString)
    {
        string systemConnectionString = _systemSqlConnectionFactory.SystemConnectionString;

        if (string.IsNullOrWhiteSpace(systemConnectionString))
            return;

        if (!SqlCatalogRoutingGuard.TargetsSameCatalog(tenantConnectionString, systemConnectionString))
            return;

        throw new TenantIsolationException(
            "Tenant-scoped SQL request for tenant '"
            + tenantId.ToString("D")
            + "' resolved to the control-plane catalog; refusing to open the connection.");
    }
}
