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

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        int pollSeconds = Math.Clamp(_processorOptions.Value.PollIntervalSeconds, 5, 300);
        TimeSpan pollInterval = TimeSpan.FromSeconds(pollSeconds);

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                await _processor.ProcessPendingBatchAsync(leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cosmos graph snapshot outbox host loop error.");
            }

            try
            {
                await Task.Delay(pollInterval, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
