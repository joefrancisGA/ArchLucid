using ArchLucid.Persistence.Coordination.Export;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Periodically drains <see cref="IRunExportBlobPushOutboxRepository" /> so run-export blob pushes complete durably.
/// </summary>
/// <remarks>
///     When <c>HostLeaderElection:Enabled</c> is true and storage is SQL, only one worker replica drains the outbox.
/// </remarks>
public sealed class RunExportBlobPushOutboxHostedService(
    IRunExportBlobPushOutboxProcessor processor,
    ILogger<RunExportBlobPushOutboxHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator)
    : LeaderElectedOutboxHostedServiceBase(electionCoordinator, logger)
{
    private readonly IRunExportBlobPushOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    protected override string LeaseName => HostElectionLeaseNames.RunExportBlobPushOutbox;

    protected override string LoopName => "Run export blob push outbox";

    protected override Func<CancellationToken, Task<int>> ProcessPendingBatch =>
        _processor.ProcessPendingBatchAsync;
}
