using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathRankQueryService
{
    Task<SecurityEvidencePathRankedPageResponse> ListRankedPathsAsync(
        ScopeContext scope,
        Guid? snapshotId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<SecurityEvidencePathRankDetailResponse?> TryGetPathRankAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default);
}
