using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>Runs tenant DbUp scripts and mirrors the control-plane <c>dbo.Tenants</c> row into the tenant catalog.</summary>
public sealed partial class SqlTenantSqlCatalogProvisioner(
    ISystemSqlConnectionFactory systemSqlConnectionFactory,
    ITenantDatabaseBindingRepository bindingRepository,
    ITenantDatabaseResolver tenantDatabaseResolver,
    IWarmTenantCatalogStandbyRepository warmStandbyRepository,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    IOptionsMonitor<WarmTenantCatalogOptions> warmCatalogOptions,
    ILogger<SqlTenantSqlCatalogProvisioner> logger) : ITenantSqlCatalogProvisioner
{
    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory =
        systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));

    private readonly ITenantDatabaseBindingRepository _bindingRepository =
        bindingRepository ?? throw new ArgumentNullException(nameof(bindingRepository));

    private readonly ITenantDatabaseResolver _tenantDatabaseResolver =
        tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));

    private readonly IWarmTenantCatalogStandbyRepository _warmStandbyRepository =
        warmStandbyRepository ?? throw new ArgumentNullException(nameof(warmStandbyRepository));

    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions =
        topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

    private readonly IOptionsMonitor<WarmTenantCatalogOptions> _warmCatalogOptions =
        warmCatalogOptions ?? throw new ArgumentNullException(nameof(warmCatalogOptions));

    private readonly ILogger<SqlTenantSqlCatalogProvisioner> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));
}
