using ArchLucid.Application.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Periodically pre-warms the executive ROI summary cache for active tenants (fail-open).
/// </summary>
public sealed class ExecutiveRoiCacheWarmupHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<ExecutiveRoiCacheWarmupOptions> optionsMonitor,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<ExecutiveRoiCacheWarmupHostedService> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<ExecutiveRoiCacheWarmupOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<ExecutiveRoiCacheWarmupHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.ExecutiveRoiCacheWarmup,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            ExecutiveRoiCacheWarmupOptions opts = _optionsMonitor.CurrentValue;

            if (opts.Enabled)
            {
                try
                {
                    await WarmActiveTenantsAsync(leaderToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                        _logger.LogWarning(ex, "Executive ROI cache warmup pass failed; continuing fail-open.");
                }
            }

            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

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

    private async Task WarmActiveTenantsAsync(CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        ITenantRepository tenantRepository = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
        IExecutiveRoiSummaryService roiService = scope.ServiceProvider.GetRequiredService<IExecutiveRoiSummaryService>();

        int warmed = await ExecutiveRoiBackgroundTenantRollup.ForEachActiveTenantAsync(
            tenantRepository,
            async (ScopeContext tenantScope, CancellationToken ct) =>
            {
                await roiService.BuildAsync(ct).ConfigureAwait(false);
            },
            _logger,
            cancellationToken).ConfigureAwait(false);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Executive ROI cache warmup completed for {TenantCount} active tenants.", warmed);
    }
}
