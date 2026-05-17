using ArchLucid.Core.Analytics;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Leader-elected worker that materializes pseudonymized <c>dbo.InternalCrossTenantRollupDaily</c> rows.</summary>
public sealed class InternalCrossTenantRollupHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptionsMonitor<InternalCrossTenantAnalyticsOptions> optionsMonitor,
    ILogger<InternalCrossTenantRollupHostedService> logger) : BackgroundService
{
    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.InternalCrossTenantRollup,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        InternalCrossTenantAnalyticsOptions initial = optionsMonitor.CurrentValue;

        if (!initial.RollupJobEnabled)
        {
            logger.LogInformation("Internal cross-tenant rollup worker is disabled via configuration.");

            return;
        }

        logger.LogInformation(
            "Internal cross-tenant rollup worker started (interval {Hours} hours).",
            Math.Max(1, initial.RollupIntervalHours));

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                IInternalCrossTenantAnalyticsService analytics =
                    scope.ServiceProvider.GetRequiredService<IInternalCrossTenantAnalyticsService>();

                DateOnly rollupDate = DateOnly.FromDateTime(TimeProvider.System.GetUtcNow().UtcDateTime);

                await analytics.RefreshDailyRollupsAsync(rollupDate, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Internal cross-tenant rollup iteration failed.");
            }

            InternalCrossTenantAnalyticsOptions opts = optionsMonitor.CurrentValue;

            if (!opts.RollupJobEnabled)
                break;

            TimeSpan delay = TimeSpan.FromHours(Math.Max(1, opts.RollupIntervalHours));

            try
            {
                await Task.Delay(delay, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
