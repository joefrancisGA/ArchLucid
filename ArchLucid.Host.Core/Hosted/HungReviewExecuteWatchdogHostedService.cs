
using ArchLucid.Application.DataConsistency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Hosted;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Marks hung <c>WaitingForResults</c> reviews as failed (robustness #5).</summary>
public sealed class HungReviewExecuteWatchdogHostedService(
    IServiceScopeFactory scopeFactory,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptionsMonitor<HungReviewExecuteWatchdogOptions> optionsMonitor,
    ILogger<HungReviewExecuteWatchdogHostedService> logger) : BackgroundService
{
    private const string LeaderLeaseName = "hosted:hung-review-execute-watchdog";

    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        electionCoordinator.RunLeaderWorkAsync(LeaderLeaseName, LoopAsync, stoppingToken);

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            HungReviewExecuteWatchdogOptions options = optionsMonitor.CurrentValue;

            if (options.Enabled)
            {
                try
                {
                    using IServiceScope scope = scopeFactory.CreateScope();
                    IHungReviewExecuteWatchdog watchdog =
                        scope.ServiceProvider.GetRequiredService<IHungReviewExecuteWatchdog>();

                    _ = await watchdog.RemediateAsync(leaderToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    if (logger.IsEnabled(LogLevel.Warning))
                        logger.LogWarning(ex, "Hung review execute watchdog iteration failed.");
                }
            }

            int minutes = Math.Clamp(optionsMonitor.CurrentValue.IntervalMinutes, 5, 24 * 60);

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(minutes), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                return;
            }
        }
    }
}
