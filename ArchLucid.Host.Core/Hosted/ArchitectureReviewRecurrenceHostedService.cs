using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

public sealed class ArchitectureReviewRecurrenceHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptions<ArchitectureReviewRecurrenceHostedServiceOptions> options,
    ILogger<ArchitectureReviewRecurrenceHostedService> logger) : BackgroundService
{
    private const int MaxSchedulesPerPoll = 5;

    private readonly TimeSpan _pollInterval = NormalizePollInterval(options);

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.ArchitectureReviewRecurrencePolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        logger.LogInformation(
            "Architecture review recurrence hosted service started (poll every {Minutes} minutes).",
            _pollInterval.TotalMinutes);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                ArchitectureReviewRecurrenceDueScheduleProcessor processor =
                    scope.ServiceProvider.GetRequiredService<ArchitectureReviewRecurrenceDueScheduleProcessor>();

                await processor.ProcessDueAsync(TimeProvider.System.UtcNowDateTime(), MaxSchedulesPerPoll, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Architecture review recurrence poll iteration failed.");
            }

            try
            {
                await Task.Delay(_pollInterval, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private static TimeSpan NormalizePollInterval(IOptions<ArchitectureReviewRecurrenceHostedServiceOptions> options)
    {
        TimeSpan interval = options.Value.PollInterval;

        if (interval <= TimeSpan.Zero)
            return TimeSpan.FromMinutes(10);

        return interval;
    }
}
