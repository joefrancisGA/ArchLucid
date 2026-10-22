using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

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
    IOptions<BackgroundJobsOptions> backgroundJobsOptions,
    ILogger<BackgroundJobStuckRunningWatchdogHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(1);

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly BackgroundJobsOptions _backgroundJobsOptions =
        backgroundJobsOptions?.Value ?? throw new ArgumentNullException(nameof(backgroundJobsOptions));

    private readonly ILogger<BackgroundJobStuckRunningWatchdogHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    ///     Reclaim threshold must exceed queue visibility so a healthy worker is not reset while its message is still
    ///     invisible (default visibility is 15 minutes; the prior fixed 10-minute threshold caused duplicate execution).
    /// </summary>
    internal static TimeSpan ResolveStaleRunningThreshold(BackgroundJobsOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        int visibilityMinutes = Math.Clamp(options.ProcessorVisibilityMinutes, 1, 120);

        return TimeSpan.FromMinutes(visibilityMinutes + 1);
    }

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
                await BackgroundJobStuckRunningWatchdogBackgroundWork.RunSinglePassAsync(
                    _scopeFactory,
                    Options.Create(_backgroundJobsOptions),
                    _logger,
                    leaderToken);
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
