using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathInspectorQueryService(
    ISecurityEvidencePathRepository pathRepository,
    IOperationalSecurityFindingRepository findingRepository,
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

        SecurityEvidencePathRecord? path = await pathRepository.TryGetByIdAsync(scope.TenantId, pathId, cancellationToken);

        if (path is null
            || path.WorkspaceId != scope.WorkspaceId
            || path.ProjectId != scope.ProjectId)
        {
            return null;
        }

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathAsync(scope.TenantId, pathId, cancellationToken);

        IReadOnlyList<Guid> citingFindingIds =
            await findingRepository.ListFindingIdsByPathIdAsync(scope.TenantId, pathId, cancellationToken);

        SecurityEvidencePathHopRecord? weakestHopRecord = hops.FirstOrDefault(hop => hop.HopOrdinal == path.WeakestHopOrdinal);

        IReadOnlyList<SecurityEvidenceCutPointRecord> relatedCutPoints =
            await cutPointRepository.ListByPathIdAsync(scope.TenantId, pathId, cancellationToken);

        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows =
            await routingRepository.ListByPathIdAsync(scope.TenantId, pathId, cancellationToken);

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
            ExplanationTemplate = SecurityEvidencePathExplanationTemplateBuilder.Build(path, hops),
            RelatedCutPoints = relatedCutPoints
                .Select(SecurityEvidenceCutPointResponseMapper.MapSummary)
                .ToList(),
            Routing = routingRows.Select(MapRouting).ToList(),
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
