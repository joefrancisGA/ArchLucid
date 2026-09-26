using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathInspectorQueryService(
    ISecurityEvidencePathRepository pathRepository,
    IProjectScopedOperationalSecurityFindingRepository findingRepository,
    ISecurityEvidenceCutPointRepository cutPointRepository,
    ISecurityEvidencePathRoutingRepository routingRepository) : ISecurityEvidencePathInspectorQueryService
{
    public async Task<PagedResponse<SecurityEvidencePathSummaryResponse>> ListPathsAsync(
        ScopeContext scope,
        Guid? snapshotId,
        PathKind? pathKind,
        PathConfidenceBand? confidenceBand,
        Guid? cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        SecurityEvidencePathListFilter filter = new()
        {
            SnapshotId = snapshotId,
            PathKind = pathKind,
            ConfidenceBand = confidenceBand,
            CloudResourceId = cloudResourceId,
        };

        (IReadOnlyList<SecurityEvidencePathRecord> items, int totalCount) = await pathRepository.ListPagedAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            filter,
            page,
            pageSize,
            cancellationToken);

        IReadOnlyList<SecurityEvidencePathSummaryResponse> summaries = items
            .Select(MapSummary)
            .ToList();

        return PagedResponseBuilder.FromDatabasePage(summaries, totalCount, page, pageSize);
    }

    public async Task<SecurityEvidencePathDetailResponse?> TryGetPathDetailAsync(
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

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        IReadOnlyList<Guid> citingFindingIds =
            await findingRepository.ListFindingIdsByPathIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        SecurityEvidencePathHopRecord? weakestHopRecord = hops.FirstOrDefault(hop => hop.HopOrdinal == path.WeakestHopOrdinal);

        IReadOnlyList<SecurityEvidenceCutPointRecord> relatedCutPoints =
            await cutPointRepository.ListByPathIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows =
            await routingRepository.ListByPathIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

        IReadOnlyList<SecurityEvidencePathRecord> snapshotPaths =
            await pathRepository.ListBySnapshotAsync(
                ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), path.SnapshotId),
                cancellationToken);

        if (!snapshotPaths.Any(candidate => candidate.PathId == path.PathId))
        {
            snapshotPaths = [path, .. snapshotPaths];
        }

        List<(
            SecurityEvidencePathRecord Path,
            IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> pathEvidence = [];
        Dictionary<Guid, IReadOnlyList<Guid>> findingIdsByPath = [];

        foreach (SecurityEvidencePathRecord snapshotPath in snapshotPaths)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> snapshotHops =
                snapshotPath.PathId == path.PathId
                    ? hops
                    : await pathRepository.ListHopsByPathInScopeAsync(
                        scope.ToProjectScopeKey(),
                        snapshotPath.PathId,
                        cancellationToken);
            IReadOnlyList<Guid> snapshotFindingIds =
                snapshotPath.PathId == path.PathId
                    ? citingFindingIds
                    : await findingRepository.ListFindingIdsByPathIdInScopeAsync(
                        scope.ToProjectScopeKey(),
                        snapshotPath.PathId,
                        cancellationToken);

            pathEvidence.Add((snapshotPath, snapshotHops));
            findingIdsByPath[snapshotPath.PathId] = snapshotFindingIds;
        }

        IReadOnlyList<SecureNowHypothesisResponse> hypotheses =
            SecureNowHypothesisAnalyzer
                .Analyze(pathEvidence, findingIdsByPath)
                .Where(hypothesis => hypothesis.CitedPathIds.Contains(path.PathId))
                .ToList();

        return new SecurityEvidencePathDetailResponse
        {
            PathId = path.PathId,
            SnapshotId = path.SnapshotId,
            PathKind = path.PathKind.ToString(),
            PathConfidenceBand = path.PathConfidenceBand.ToString(),
            WeakestHopOrdinal = path.WeakestHopOrdinal,
            WeakestHopReason = path.WeakestHopReason,
            CrownJewelAssertionId = path.CrownJewelAssertionId,
            Hops = hops.Select(MapHop).ToList(),
            CitingFindingIds = citingFindingIds,
            WeakestHop = weakestHopRecord is null ? null : MapWeakestHop(weakestHopRecord, path.WeakestHopReason),
            ExplanationTemplate = SecurityEvidencePathExplanationTemplateBuilder.Build(path, hops, relatedCutPoints),
            RelatedCutPoints = relatedCutPoints
                .Select(SecurityEvidenceCutPointResponseMapper.MapSummary)
                .ToList(),
            Routing = routingRows.Select(MapRouting).ToList(),
            Hypotheses = hypotheses,
        };
    }

    private static SecurityEvidencePathRoutingResponse MapRouting(SecurityEvidencePathRoutingRecord row) =>
        new()
        {
            Role = row.Role.ToString(),
            PrincipalId = row.PrincipalId,
            DisplayName = row.DisplayName,
            ProvenanceKind = row.ProvenanceKind.ToString(),
            SourceReference = row.SourceReference,
        };

    private static SecurityEvidencePathSummaryResponse MapSummary(SecurityEvidencePathRecord path) =>
        new()
        {
            PathId = path.PathId,
            SnapshotId = path.SnapshotId,
            PathKind = path.PathKind.ToString(),
            PathConfidenceBand = path.PathConfidenceBand.ToString(),
            WeakestHopOrdinal = path.WeakestHopOrdinal,
            WeakestHopReason = path.WeakestHopReason,
            CreatedUtc = path.CreatedUtc,
            UpdatedUtc = path.UpdatedUtc,
        };

    private static SecurityEvidencePathHopResponse MapHop(SecurityEvidencePathHopRecord hop) =>
        new()
        {
            HopOrdinal = hop.HopOrdinal,
            FromNodeLabel = SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(hop.FromNodeId),
            ToNodeLabel = SecurityEvidencePathExplanationTemplateBuilder.ShortNodeLabel(hop.ToNodeId),
            EdgeType = hop.EdgeType,
            ProvenanceKind = hop.ProvenanceKind.ToString(),
            HopConfidenceBand = hop.HopConfidenceBand.ToString(),
            InferenceSource = hop.InferenceSource,
            EvidenceReference = hop.EvidenceReference,
            CloudResourceId = hop.CloudResourceId,
        };

    private static SecurityEvidencePathWeakestHopResponse MapWeakestHop(
        SecurityEvidencePathHopRecord hop,
        string reason) =>
        new()
        {
            HopOrdinal = hop.HopOrdinal,
            EdgeType = hop.EdgeType,
            HopConfidenceBand = hop.HopConfidenceBand.ToString(),
            ProvenanceKind = hop.ProvenanceKind.ToString(),
            Reason = reason,
        };
}
