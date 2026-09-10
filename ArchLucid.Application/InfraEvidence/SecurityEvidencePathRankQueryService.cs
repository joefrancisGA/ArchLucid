using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathRankQueryService(
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidencePathRankRepository rankRepository,
    ISecurityEvidenceCutPointRepository cutPointRepository) : ISecurityEvidencePathRankQueryService
{
    public async Task<SecurityEvidencePathRankedPageResponse> ListRankedPathsAsync(
        ScopeContext scope,
        Guid? snapshotId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (IReadOnlyList<SecurityEvidencePathRankRecord> ranks, int totalCount) =
            await rankRepository.ListRankedPagedAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                snapshotId,
                page,
                pageSize,
                cancellationToken);

        IReadOnlyList<SecurityEvidenceCutPointRecord> topCutPoints = [];

        if (snapshotId is not null && snapshotId != Guid.Empty)
        {
            topCutPoints = await cutPointRepository.ListBySnapshotAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                snapshotId.Value,
                cancellationToken);
        }

        if (ranks.Count == 0)
        {
            return new SecurityEvidencePathRankedPageResponse
            {
                Items = [],
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TopCutPoints = topCutPoints
                    .Take(10)
                    .Select(SecurityEvidenceCutPointResponseMapper.MapSummary)
                    .ToList(),
            };
        }

        Dictionary<Guid, SecurityEvidencePathRecord> pathHeaders = [];

        foreach (SecurityEvidencePathRankRecord rank in ranks)
        {
            if (pathHeaders.ContainsKey(rank.PathId))
            {
                continue;
            }

            SecurityEvidencePathRecord? path =
                await pathRepository.TryGetByIdAsync(scope.TenantId, rank.PathId, cancellationToken);

            if (path is not null
                && path.WorkspaceId == scope.WorkspaceId
                && path.ProjectId == scope.ProjectId)
            {
                pathHeaders[rank.PathId] = path;
            }
        }

        List<SecurityEvidencePathRankSummaryResponse> summaries = [];

        foreach (SecurityEvidencePathRankRecord rank in ranks)
        {

            if (!pathHeaders.TryGetValue(rank.PathId, out SecurityEvidencePathRecord? path))
            {
                continue;
            }

            IReadOnlyList<SecurityEvidenceCutPointRecord> relatedCutPoints =
                await cutPointRepository.ListByPathIdAsync(scope.TenantId, rank.PathId, cancellationToken);

            summaries.Add(MapSummary(rank, path, relatedCutPoints));
        }

        return new SecurityEvidencePathRankedPageResponse
        {
            Items = summaries,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TopCutPoints = topCutPoints
                .Take(10)
                .Select(SecurityEvidenceCutPointResponseMapper.MapSummary)
                .ToList(),
        };
    }

    public async Task<SecurityEvidencePathRankDetailResponse?> TryGetPathRankAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (pathId == Guid.Empty)
        {
            return null;
        }

        SecurityEvidencePathRecord? path = await pathRepository.TryGetByIdAsync(scope.TenantId, pathId, cancellationToken);

        if (path is null
            || path.WorkspaceId != scope.WorkspaceId
            || path.ProjectId != scope.ProjectId)
        {
            return null;
        }

        SecurityEvidencePathRankRecord? rank =
            await rankRepository.TryGetRankAsync(scope.TenantId, pathId, cancellationToken);

        if (rank is null)
        {
            return null;
        }

        SecurityEvidencePathRankProse prose =
            SecurityEvidencePathRankExplanationBuilder.BuildDimensionProse(path, rank);

        return new SecurityEvidencePathRankDetailResponse
        {
            PathId = rank.PathId,
            SnapshotId = rank.SnapshotId,
            RankOrder = rank.RankOrder,
            RuleVersion = rank.RuleVersion,
            TechnicalExposureScore = rank.TechnicalExposureScore,
            PrivilegeDepthScore = rank.PrivilegeDepthScore,
            BlastRadiusScore = rank.BlastRadiusScore,
            BusinessConsequenceScore = rank.BusinessConsequenceScore,
            ConfidenceBandScore = rank.ConfidenceBandScore,
            CompositeSortScore = rank.CompositeSortScore,
            ExplanationSummary = rank.ExplanationSummary,
            BreakdownJson = rank.BreakdownJson,
            PathKind = path.PathKind.ToString(),
            PathConfidenceBand = path.PathConfidenceBand.ToString(),
            DimensionProse = new SecurityEvidencePathRankDimensionProseResponse
            {
                TechnicalExposure = prose.TechnicalExposure,
                PrivilegeDepth = prose.PrivilegeDepth,
                BlastRadius = prose.BlastRadius,
                BusinessConsequence = prose.BusinessConsequence,
                ConfidenceBand = prose.ConfidenceBand,
                Overall = prose.Overall,
            },
            ComputedUtc = rank.ComputedUtc,
        };
    }

    private static SecurityEvidencePathRankSummaryResponse MapSummary(
        SecurityEvidencePathRankRecord rank,
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidenceCutPointRecord> relatedCutPoints) =>
        new()
        {
            PathId = rank.PathId,
            SnapshotId = rank.SnapshotId,
            RankOrder = rank.RankOrder,
            RuleVersion = rank.RuleVersion,
            TechnicalExposureScore = rank.TechnicalExposureScore,
            PrivilegeDepthScore = rank.PrivilegeDepthScore,
            BlastRadiusScore = rank.BlastRadiusScore,
            BusinessConsequenceScore = rank.BusinessConsequenceScore,
            ConfidenceBandScore = rank.ConfidenceBandScore,
            CompositeSortScore = rank.CompositeSortScore,
            ExplanationSummary = rank.ExplanationSummary,
            PathKind = path.PathKind.ToString(),
            PathConfidenceBand = path.PathConfidenceBand.ToString(),
            ComputedUtc = rank.ComputedUtc,
            RelatedCutPoints = relatedCutPoints
                .Select(SecurityEvidenceCutPointResponseMapper.MapSummary)
                .ToList(),
        };
}
