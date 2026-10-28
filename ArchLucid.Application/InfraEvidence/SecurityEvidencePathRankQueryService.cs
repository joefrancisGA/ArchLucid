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

        // Match by both path and snapshot. A set avoids scanning every rank
        // for every loaded header, while preserving cross-snapshot rejection.
        HashSet<(Guid PathId, Guid SnapshotId)> rankedKeys = ranks
            .Where(rank => snapshotId is null || snapshotId == rank.SnapshotId)
            .Select(rank => (rank.PathId, rank.SnapshotId))
            .ToHashSet();

        Dictionary<(Guid PathId, Guid SnapshotId), SecurityEvidencePathRecord> pathHeaders = loadedPaths
            .Where(path => rankedKeys.Contains((path.PathId, path.SnapshotId)))
            .GroupBy(path => (path.PathId, path.SnapshotId))
            .ToDictionary(group => group.Key, group => group.First());

        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPointPool = snapshotId is not null && snapshotId != Guid.Empty
            ? topCutPoints
            : await cutPointRepository.ListBySnapshotsInScopeAsync(
                projectScope,
                ranks.Select(rank => rank.SnapshotId).Distinct().ToArray(),
                cancellationToken);

        // Deserialize each cut-point path list only once per page and index
        // by (snapshot, path). The previous loop parsed every JSON list again
        // for every ranked path, producing O(paths * cutPoints) work.
        Dictionary<(Guid SnapshotId, Guid PathId), List<SecurityEvidenceCutPointRecord>> cutPointsByPath = [];
        foreach (SecurityEvidenceCutPointRecord cutPoint in cutPointPool)
        {
            foreach (Guid citedPathId in GetCitedPathIds(cutPoint))
            {
                (Guid SnapshotId, Guid PathId) key = (cutPoint.SnapshotId, citedPathId);
                if (!cutPointsByPath.TryGetValue(key, out List<SecurityEvidenceCutPointRecord>? matches))
                {
                    matches = [];
                    cutPointsByPath[key] = matches;
                }

                matches.Add(cutPoint);
            }
        }

        List<SecurityEvidencePathRankSummaryResponse> summaries = [];

        foreach (SecurityEvidencePathRankRecord rank in ranks)
        {
            if (!pathHeaders.TryGetValue((rank.PathId, rank.SnapshotId), out SecurityEvidencePathRecord? path))
            {
                continue;
            }

            cutPointsByPath.TryGetValue((path.SnapshotId, path.PathId), out List<SecurityEvidenceCutPointRecord>? relatedCutPoints);
            summaries.Add(MapSummary(rank, path, relatedCutPoints ?? []));
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

    private static IReadOnlyCollection<Guid> GetCitedPathIds(SecurityEvidenceCutPointRecord cutPoint)
    {
        if (string.IsNullOrWhiteSpace(cutPoint.CollapsedPathIdsJson))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<Guid>>(cutPoint.CollapsedPathIdsJson)?
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToArray() ?? [];
        }
        catch (JsonException)
        {
            return [];
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
