using ArchLucid.Application.WeeklySponsorSummary;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Hourly leader-elected poll that sends weekly run-summary one-pager emails when the global schedule matches.</summary>
public sealed class WeeklySponsorSummaryHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<WeeklySponsorSummaryHostedService> logger,
    TimeProvider? timeProvider = null) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromHours(1);
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.WeeklySponsorSummaryPolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        logger.LogInformation(
            "Weekly sponsor report delivery started (poll every {Hours} hours).",
            PollInterval.TotalHours);

        using PeriodicTimer timer = new(PollInterval, _timeProvider);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                WeeklySponsorSummaryDeliveryScanner scanner =
                    scope.ServiceProvider.GetRequiredService<WeeklySponsorSummaryDeliveryScanner>();

                await scanner.PublishDueAsync(_timeProvider.GetUtcNow(), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Weekly sponsor report delivery iteration failed.");
            }

            try
            {
                await timer.WaitForNextTickAsync(leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
