using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Background worker that polls due advisory scan schedules on a fixed interval.
/// </summary>
/// <remarks>
/// Creates a scope per iteration and delegates to <see cref="AdvisoryDueScheduleProcessor"/>.
/// When <c>HostLeaderElection:Enabled</c> is true and storage is SQL, only the replica holding the lease polls (multi-worker safe).
/// Per-schedule failures are logged and do not stop the loop.
/// </remarks>
public sealed class AdvisoryScanHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptions<AdvisoryScanHostedServiceOptions> options,
    ILogger<AdvisoryScanHostedService> logger) : BackgroundService
{
    private readonly TimeSpan _pollInterval = NormalizePollInterval(options);

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.AdvisoryScanPolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        logger.LogInformation("Advisory scan hosted service started (poll every {Minutes} minutes).", _pollInterval.TotalMinutes);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                AdvisoryDueScheduleProcessor processor = scope.ServiceProvider.GetRequiredService<AdvisoryDueScheduleProcessor>();

                await processor.ProcessDueAsync(TimeProvider.System.UtcNowDateTime(), 10, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Advisory scan poll iteration failed.");
            }

            try
            {
                await Task.Delay(_pollInterval, leaderToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private static TimeSpan NormalizePollInterval(IOptions<AdvisoryScanHostedServiceOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);

        AdvisoryScanHostedServiceOptions value = options.Value;

        if (value.PollInterval <= TimeSpan.Zero)
            return TimeSpan.FromMinutes(5);

        return value.PollInterval;
    }
}
