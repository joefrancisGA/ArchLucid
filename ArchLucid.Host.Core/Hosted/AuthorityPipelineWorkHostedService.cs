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
    HostLeaderElectionCoordinator electionCoordinator)
    : LeaderElectedOutboxHostedServiceBase(electionCoordinator, logger)
{
    private readonly IAuthorityPipelineWorkProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    protected override string LeaseName => HostElectionLeaseNames.AuthorityPipelineWorkOutbox;

    protected override string LoopName => "Authority pipeline work outbox";

    protected override Func<CancellationToken, Task<int>> ProcessPendingBatch =>
        _processor.ProcessPendingBatchAsync;
}
