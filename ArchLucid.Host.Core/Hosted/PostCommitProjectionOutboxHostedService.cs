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
    HostLeaderElectionCoordinator electionCoordinator)
    : LeaderElectedOutboxHostedServiceBase(electionCoordinator, logger)
{
    private readonly IPostCommitProjectionOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    protected override string LeaseName => HostElectionLeaseNames.PostCommitProjectionOutbox;

    protected override string LoopName => "Post-commit projection outbox";

    protected override Func<CancellationToken, Task<int>> ProcessPendingBatch =>
        _processor.ProcessPendingBatchAsync;
}
