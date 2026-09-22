using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathInspectorQueryService
{
    Task<PagedResponse<SecurityEvidencePathSummaryResponse>> ListPathsAsync(
        ScopeContext scope,
        Guid? snapshotId,
        PathKind? pathKind,
        PathConfidenceBand? confidenceBand,
        Guid? cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<SecurityEvidencePathDetailResponse?> TryGetPathDetailAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default);
}
