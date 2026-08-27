using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Persistence.Queries;

/// <summary>
///     <see cref="IAuthorityQueryService" /> backed by the same repository abstractions as
///     <see cref="DapperAuthorityQueryService" /> (in-memory stores in test / storage-off mode).
/// </summary>
public sealed partial class InMemoryAuthorityQueryService(
    IRunRepository runRepository,
    IContextSnapshotRepository contextSnapshotRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IGraphSnapshotProjectionCache graphSnapshotProjectionCache,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IArtifactBundleRepository artifactBundleRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IRiskExceptionRepository riskExceptionRepository,
    IArchitectureIdentityRepository? architectureIdentityRepository = null)
    : IAuthorityQueryService
{
    private readonly IArchitectureIdentityRepository? _architectureIdentityRepository =
        architectureIdentityRepository;
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IRiskExceptionRepository _riskExceptionRepository =
        riskExceptionRepository ?? throw new ArgumentNullException(nameof(riskExceptionRepository));
}
