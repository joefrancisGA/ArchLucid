using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Periodically drains <see cref="IIntegrationEventOutboxRepository"/> after authority commits.</summary>
public sealed class IntegrationEventOutboxHostedService(
    IIntegrationEventOutboxProcessor processor,
    ILogger<IntegrationEventOutboxHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IIntegrationEventOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    private readonly ILogger<IntegrationEventOutboxHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.IntegrationEventOutbox,
            LoopAsync,
            stoppingToken);
    }

    private Task LoopAsync(CancellationToken leaderToken)
    {
        return AdaptiveOutboxDrainLoop.RunAsync(
            _processor.ProcessPendingBatchAsync,
            _logger,
            "Integration event outbox",
            leaderToken);
    }
}
