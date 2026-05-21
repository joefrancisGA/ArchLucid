using ArchLucid.Application.WeeklyExecutiveSummary;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Hourly leader-elected poll that sends weekly run-summary one-pager emails when the global schedule matches.</summary>
public sealed class WeeklyExecutiveSummaryHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<WeeklyExecutiveSummaryHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromHours(1);

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.WeeklyExecutiveSummaryPolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        logger.LogInformation(
            "Weekly executive summary delivery started (poll every {Hours} hours).",
            PollInterval.TotalHours);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                WeeklyExecutiveSummaryDeliveryScanner scanner =
                    scope.ServiceProvider.GetRequiredService<WeeklyExecutiveSummaryDeliveryScanner>();

                await scanner.PublishDueAsync(TimeProvider.System.GetUtcNow(), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Weekly executive summary delivery iteration failed.");
            }

            try
            {
                await Task.Delay(PollInterval, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
