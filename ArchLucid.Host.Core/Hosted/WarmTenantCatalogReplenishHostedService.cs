using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Leader-elected warm catalog pool replenishment (TB-018).</summary>
public sealed class WarmTenantCatalogReplenishHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<WarmTenantCatalogOptions> optionsMonitor,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<WarmTenantCatalogReplenishHostedService> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<WarmTenantCatalogOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<WarmTenantCatalogReplenishHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.WarmTenantCatalogReplenish,
            LoopAsync,
            stoppingToken);

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            WarmTenantCatalogOptions opts = _optionsMonitor.CurrentValue;
            int minutes = Math.Clamp(opts.ReplenishIntervalMinutes, 5, 10_080);
            TimeSpan delay = TimeSpan.FromMinutes(minutes);

            if (opts.Enabled)
            {
                try
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IWarmTenantCatalogReplenishService replenish =
                        scope.ServiceProvider.GetRequiredService<IWarmTenantCatalogReplenishService>();

                    await replenish.ReplenishAsync(leaderToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                        _logger.LogWarning(ex, "Warm tenant catalog replenish pass failed; continuing fail-open.");
                }
            }

            try
            {
                await Task.Delay(delay, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
