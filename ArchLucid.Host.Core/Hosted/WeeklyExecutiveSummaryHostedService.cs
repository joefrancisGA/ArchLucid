using ArchLucid.Application.WeeklySponsorReport;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Hourly leader-elected poll that sends weekly run-summary one-pager emails when the global schedule matches.</summary>
public sealed class WeeklySponsorReportHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<WeeklySponsorReportHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromHours(1);

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.WeeklySponsorReportPolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        logger.LogInformation(
            "Weekly Sponsor report delivery started (poll every {Hours} hours).",
            PollInterval.TotalHours);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                WeeklySponsorReportDeliveryScanner scanner =
                    scope.ServiceProvider.GetRequiredService<WeeklySponsorReportDeliveryScanner>();

                await scanner.PublishDueAsync(TimeProvider.System.GetUtcNow(), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Weekly Sponsor report delivery iteration failed.");
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
