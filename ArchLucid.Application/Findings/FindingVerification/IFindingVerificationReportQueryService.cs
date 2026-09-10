using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings.FindingVerification;

public interface IFindingVerificationReportQueryService
{
    Task<FindingVerificationReportResponse?> GetReportAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FindingVerificationReportSummaryResponse>> ListReportsByRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ArtifactDescriptor>> ListArtifactDescriptorsByRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);
}
