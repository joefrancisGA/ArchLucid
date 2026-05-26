using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed class WarmTenantCatalogReplenishService(
    IWarmTenantCatalogStandbyRepository standbyRepository,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    IOptionsMonitor<WarmTenantCatalogOptions> warmOptions,
    TimeProvider timeProvider,
    ILogger<WarmTenantCatalogReplenishService> logger) : IWarmTenantCatalogReplenishService
{
    private readonly IWarmTenantCatalogStandbyRepository _standbyRepository =
        standbyRepository ?? throw new ArgumentNullException(nameof(standbyRepository));

    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions =
        topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

    private readonly IOptionsMonitor<WarmTenantCatalogOptions> _warmOptions =
        warmOptions ?? throw new ArgumentNullException(nameof(warmOptions));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<WarmTenantCatalogReplenishService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task ReplenishAsync(CancellationToken cancellationToken)
    {
        WarmTenantCatalogOptions opts = _warmOptions.CurrentValue;
        SqlTopologyOptions topology = _topologyOptions.CurrentValue;

        if (!opts.Enabled
            || topology.Mode != SqlTopologyMode.SystemWithPerTenantCatalogs
            || string.IsNullOrWhiteSpace(topology.TenantCatalogConnectionStringTemplate))
        {
            return;
        }

        int target = Math.Clamp(opts.TargetDepth, 0, 32);
        int current = await _standbyRepository.CountUnclaimedAsync(cancellationToken);

        int deficit = target - current;

        if (deficit <= 0)
            return;

        string template = topology.TenantCatalogConnectionStringTemplate.Trim();
        DateTimeOffset now = _timeProvider.GetUtcNow();

        for (int i = 0; i < deficit; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            Guid standbyId = Guid.NewGuid();
            string logicalName = WarmTenantCatalogNaming.SqlLogicalNameForStandby(standbyId);

            string connectionString = SqlTenantCatalogConnectionStringFactory.FromTemplate(template, logicalName);

            await SqlTenantCatalogAdminCommands.EnsureCatalogExistsAsync(connectionString, cancellationToken);

            DatabaseMigrator.RunTenant(connectionString);

            WarmTenantCatalogStandbyRecord record = new()
            {
                StandbyId = standbyId,
                SqlLogicalDatabaseName = logicalName,
                SchemaReadyUtc = now,
                CreatedUtc = now
            };

            await _standbyRepository.InsertStandbyAsync(record, cancellationToken);

            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Warm tenant catalog standby created: {DatabaseName}.", logicalName);
        }
    }
}
