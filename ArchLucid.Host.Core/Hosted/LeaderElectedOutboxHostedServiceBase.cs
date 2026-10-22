namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected adaptive drain loop shared by outbox hosted services (TB-920).
/// </summary>
public abstract class LeaderElectedOutboxHostedServiceBase(
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger logger) : BackgroundService
{
    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    protected abstract string LeaseName
    {
        get;
    }

    protected abstract string LoopName
    {
        get;
    }

    protected abstract Func<CancellationToken, Task<int>> ProcessPendingBatch
    {
        get;
    }

    protected virtual TimeSpan? MaxIdleDelay => null;

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(LeaseName, LoopAsync, stoppingToken);
    }

    private Task LoopAsync(CancellationToken leaderToken)
    {
        if (MaxIdleDelay is TimeSpan maxIdleDelay)
        {
            return AdaptiveOutboxDrainLoop.RunAsync(
                ProcessPendingBatch,
                _logger,
                LoopName,
                leaderToken,
                baseIdleDelay: AdaptiveOutboxIdleBackoff.BaseIdleDelay,
                maxIdleDelay: maxIdleDelay);
        }

        return AdaptiveOutboxDrainLoop.RunAsync(
            ProcessPendingBatch,
            _logger,
            LoopName,
            leaderToken);
    }
}
