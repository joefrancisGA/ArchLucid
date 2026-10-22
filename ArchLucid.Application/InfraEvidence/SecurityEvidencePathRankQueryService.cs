using System.Text.Json;

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
            topCutPoints = (await cutPointRepository.ListBySnapshotAsync(
                ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId.Value),
                cancellationToken)).Where(cutPoint => cutPoint.SnapshotId == snapshotId.Value).ToList();
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

        ProjectScopeKey projectScope = scope.ToProjectScopeKey();
        Guid[] pathIds = ranks.Select(rank => rank.PathId).Distinct().ToArray();

        IReadOnlyList<SecurityEvidencePathRecord> loadedPaths =
            await pathRepository.ListByIdsInScopeAsync(projectScope, pathIds, cancellationToken);

        Dictionary<Guid, SecurityEvidencePathRecord> pathHeaders = loadedPaths
            .Where(path => ranks.Any(rank =>
                rank.PathId == path.PathId
                && rank.SnapshotId == path.SnapshotId
                && (snapshotId is null || snapshotId == rank.SnapshotId)))
            .GroupBy(path => path.PathId)
            .ToDictionary(group => group.Key, group => group.First());

        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPointPool = snapshotId is not null && snapshotId != Guid.Empty
            ? topCutPoints
            : await cutPointRepository.ListBySnapshotsInScopeAsync(
                projectScope,
                ranks.Select(rank => rank.SnapshotId).Distinct().ToArray(),
                cancellationToken);

        List<SecurityEvidencePathRankSummaryResponse> summaries = [];

        foreach (SecurityEvidencePathRankRecord rank in ranks)
        {
            if (!pathHeaders.TryGetValue(rank.PathId, out SecurityEvidencePathRecord? path))
            {
                continue;
            }

            List<SecurityEvidenceCutPointRecord> relatedCutPoints = cutPointPool
                .Where(cutPoint =>
                    cutPoint.SnapshotId == path.SnapshotId
                    && CutPointCitesPath(cutPoint, path.PathId))
                .ToList();

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

        SecurityEvidencePathRecord? path = await pathRepository.TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        if (path is null)
        {
            return null;
        }

        SecurityEvidencePathRankRecord? rank =
            await rankRepository.TryGetRankInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        if (rank is null || rank.PathId != path.PathId || rank.SnapshotId != path.SnapshotId)
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

    private static bool CutPointCitesPath(SecurityEvidenceCutPointRecord cutPoint, Guid pathId)
    {
        if (string.IsNullOrWhiteSpace(cutPoint.CollapsedPathIdsJson))
        {
            return false;
        }

        try
        {
            List<Guid>? pathIds = JsonSerializer.Deserialize<List<Guid>>(cutPoint.CollapsedPathIdsJson);
            return pathIds is not null && pathIds.Contains(pathId);
        }
        catch (JsonException)
        {
            return false;
        }
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
