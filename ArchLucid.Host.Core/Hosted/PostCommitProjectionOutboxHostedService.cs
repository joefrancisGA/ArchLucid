using ArchLucid.Persistence.Coordination.Projection;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Periodically drains <see cref="IPostCommitProjectionOutboxRepository" /> so post-commit projections complete durably.
/// </summary>
/// <remarks>
///     When <c>HostLeaderElection:Enabled</c> is true and storage is SQL, only one worker replica drains the outbox.
/// </remarks>
public sealed class PostCommitProjectionOutboxHostedService(
    IPostCommitProjectionOutboxProcessor processor,
    ILogger<PostCommitProjectionOutboxHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IPostCommitProjectionOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    private readonly ILogger<PostCommitProjectionOutboxHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.PostCommitProjectionOutbox,
            LoopAsync,
            stoppingToken);
    }

    private Task LoopAsync(CancellationToken leaderToken)
    {
        return AdaptiveOutboxDrainLoop.RunAsync(
            _processor.ProcessPendingBatchAsync,
            _logger,
            "Post-commit projection outbox",
            leaderToken);
    }
}
