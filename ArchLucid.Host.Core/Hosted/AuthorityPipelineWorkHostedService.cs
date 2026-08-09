using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Periodically drains <see cref="IAuthorityPipelineWorkRepository"/> so deferred authority stages run after the run header commits.
/// </summary>
public sealed class AuthorityPipelineWorkHostedService(
    IAuthorityPipelineWorkProcessor processor,
    ILogger<AuthorityPipelineWorkHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IAuthorityPipelineWorkProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    private readonly ILogger<AuthorityPipelineWorkHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.AuthorityPipelineWorkOutbox,
            LoopAsync,
            stoppingToken);
    }

    private Task LoopAsync(CancellationToken leaderToken)
    {
        return AdaptiveOutboxDrainLoop.RunAsync(
            _processor.ProcessPendingBatchAsync,
            _logger,
            "Authority pipeline work outbox",
            leaderToken);
    }
}
