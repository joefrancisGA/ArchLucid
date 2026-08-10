using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Periodically reclaims <c>dbo.BackgroundJobs</c> rows stuck in <see cref="BackgroundJobRow.State" /> = <c>Running</c>
///     when a worker terminates before finishing (visibility timeout / crash).
/// </summary>
/// <remarks>
/// When <c>HostLeaderElection:Enabled</c> is true and storage is SQL, only one replica runs the watchdog loop.
/// </remarks>
public sealed class BackgroundJobStuckRunningWatchdogHostedService(
    IServiceScopeFactory scopeFactory,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<BackgroundJobStuckRunningWatchdogHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(1);

    private static readonly TimeSpan StaleAfter = TimeSpan.FromMinutes(10);

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<BackgroundJobStuckRunningWatchdogHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.BackgroundJobStuckRunningWatchdog,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        using PeriodicTimer timer = new(PollInterval);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

                IBackgroundJobRepository repository =
                    scope.ServiceProvider.GetRequiredService<IBackgroundJobRepository>();

                int affected = await repository.ResetStaleRunningJobsOlderThanAsync(StaleAfter, leaderToken);

                if (affected > 0)

                    _logger.LogWarning(
                        "Reclaimed background jobs stuck Running > {Minutes} minutes: {Count}.",
                        StaleAfter.TotalMinutes,
                        affected);
            }

            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }

            catch (Exception ex) when (!leaderToken.IsCancellationRequested)

            {
                _logger.LogError(ex, "Background job watchdog iteration failed.");
            }

            try

            {
                await timer.WaitForNextTickAsync(leaderToken);
            }

            catch (OperationCanceledException)

            {
                break;
            }
        }
    }
}
