using ArchLucid.Application.SponsorDigest;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Hourly leader-elected poll that sends weekly sponsor digest emails when tenant-local schedule matches.</summary>
public sealed class SponsorDigestWeeklyHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<SponsorDigestWeeklyHostedService> logger,
    TimeProvider? timeProvider = null) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromHours(1);
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.SponsorDigestWeeklyPolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        logger.LogInformation(
            "Sponsor digest weekly delivery started (poll every {Hours} hours).",
            PollInterval.TotalHours);

        using PeriodicTimer timer = new(PollInterval, _timeProvider);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                SponsorDigestWeeklyDeliveryScanner scanner =
                    scope.ServiceProvider.GetRequiredService<SponsorDigestWeeklyDeliveryScanner>();

                await scanner.PublishDueAsync(_timeProvider.GetUtcNow(), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Sponsor digest weekly delivery iteration failed.");
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
