using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Cosmos;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Drains <c>dbo.CosmosGraphSnapshotOutbox</c> so Cosmos graph writes happen after SQL authority commits.</summary>
public sealed class CosmosGraphSnapshotOutboxHostedService(
    ICosmosGraphSnapshotOutboxProcessor processor,
    IOptions<CosmosGraphSnapshotOutboxProcessorOptions> processorOptions,
    ILogger<CosmosGraphSnapshotOutboxHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly ICosmosGraphSnapshotOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    private readonly IOptions<CosmosGraphSnapshotOutboxProcessorOptions> _processorOptions =
        processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));

    private readonly ILogger<CosmosGraphSnapshotOutboxHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.CosmosGraphSnapshotOutbox,
            LoopAsync,
            stoppingToken);
    }

    private Task LoopAsync(CancellationToken leaderToken)
    {
        int maxIdleSeconds = Math.Clamp(_processorOptions.Value.PollIntervalSeconds, 5, 300);
        TimeSpan maxIdleDelay = TimeSpan.FromSeconds(maxIdleSeconds);

        return AdaptiveOutboxDrainLoop.RunAsync(
            _processor.ProcessPendingBatchAsync,
            _logger,
            "Cosmos graph snapshot outbox",
            leaderToken,
            baseIdleDelay: AdaptiveOutboxIdleBackoff.BaseIdleDelay,
            maxIdleDelay: maxIdleDelay);
    }
}
