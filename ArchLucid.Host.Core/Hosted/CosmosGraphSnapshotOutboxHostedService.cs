using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Cosmos;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Drains <c>dbo.CosmosGraphSnapshotOutbox</c> so Cosmos graph writes happen after SQL authority commits.</summary>
public sealed class CosmosGraphSnapshotOutboxHostedService(
    ICosmosGraphSnapshotOutboxProcessor processor,
    IOptions<CosmosGraphSnapshotOutboxProcessorOptions> processorOptions,
    ILogger<CosmosGraphSnapshotOutboxHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator)
    : LeaderElectedOutboxHostedServiceBase(electionCoordinator, logger)
{
    private readonly ICosmosGraphSnapshotOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    private readonly IOptions<CosmosGraphSnapshotOutboxProcessorOptions> _processorOptions =
        processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));

    protected override string LeaseName => HostElectionLeaseNames.CosmosGraphSnapshotOutbox;

    protected override string LoopName => "Cosmos graph snapshot outbox";

    protected override Func<CancellationToken, Task<int>> ProcessPendingBatch =>
        _processor.ProcessPendingBatchAsync;

    protected override TimeSpan? MaxIdleDelay
    {
        get
        {
            int maxIdleSeconds = Math.Clamp(_processorOptions.Value.PollIntervalSeconds, 5, 300);

            return TimeSpan.FromSeconds(maxIdleSeconds);
        }
    }
}
