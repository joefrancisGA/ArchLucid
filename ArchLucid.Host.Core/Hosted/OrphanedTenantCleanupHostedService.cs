using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected hourly loop that hard-purges tenant SQL catalogs after erasure quarantine retention.
/// </summary>
public sealed class OrphanedTenantCleanupHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<OrphanedTenantCatalogCleanupOptions> optionsMonitor,
    ILogger<OrphanedTenantCleanupHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<OrphanedTenantCatalogCleanupOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<OrphanedTenantCleanupHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.OrphanedTenantCatalogCleanup,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            OrphanedTenantCatalogCleanupOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromMinutes(Math.Clamp(opts.IntervalMinutes, 15, 24 * 60));

            if (opts.Enabled)
            {
                await OrphanedTenantCatalogCleanupBackgroundWork.RunSinglePassAsync(
                    _scopeFactory,
                    _optionsMonitor,
                    _logger,
                    leaderToken);
            }

            try
            {
                await Task.Delay(delay, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
