using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathInspectorQueryServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
    private static readonly Guid SnapshotId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
    private static readonly Guid PathId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");
    private static readonly Guid FindingId = Guid.Parse("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6");
    private static readonly Guid CloudResourceId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task TryGetPathDetailAsync_returns_hops_findings_and_explanation_template()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository pathRepository = CreateSamplePathRepository();
        InMemoryFindingRepository findingRepository = new();
        findingRepository.StoredFindings.Add(CreateFinding(FindingId, PathId, CloudResourceId));

        SecurityEvidencePathInspectorQueryService sut = new(pathRepository, findingRepository, new InMemoryCutPointRepository());

        SecurityEvidencePathDetailResponse? detail = await sut.TryGetPathDetailAsync(scope, PathId, CancellationToken.None);

        detail.Should().NotBeNull();
        detail!.PathKind.Should().Be(PathKind.Privilege.ToString());
        detail.PathConfidenceBand.Should().Be(PathConfidenceBand.Probable.ToString());
        detail.CitingFindingIds.Should().ContainSingle().Which.Should().Be(FindingId);
        detail.Hops.Should().HaveCount(2);
        detail.Hops[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact.ToString());
        detail.Hops[0].FromNodeLabel.Should().StartWith("principal:");
        detail.Hops[0].ToNodeLabel.Should().Be("sa1");
        detail.WeakestHop.Should().NotBeNull();
        detail.WeakestHop!.HopOrdinal.Should().Be(2);
        detail.ExplanationTemplate.Actor.Should().NotBeNullOrWhiteSpace();
        detail.ExplanationTemplate.Asset.Should().Be("sa1");
        detail.ExplanationTemplate.Verify.Should().BeNull();
    }

    [Fact]
    public async Task TryGetPathDetailAsync_foreign_tenant_returns_null()
    {
        ScopeContext ownerScope = CreateScope();
        ScopeContext foreignScope = new()
        {
            TenantId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        SecurityEvidencePathInspectorQueryService sut = new(
            CreateSamplePathRepository(),
            new InMemoryFindingRepository(),
            new InMemoryCutPointRepository());

        SecurityEvidencePathDetailResponse? detail = await sut.TryGetPathDetailAsync(
            foreignScope,
            PathId,
            CancellationToken.None);

        detail.Should().BeNull();
    }

    [Fact]
    public async Task ListPathsAsync_filters_by_snapshot_and_cloud_resource()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository pathRepository = CreateSamplePathRepository();
        InMemoryFindingRepository findingRepository = new();
        findingRepository.StoredFindings.Add(CreateFinding(FindingId, PathId, CloudResourceId));

        SecurityEvidencePathInspectorQueryService sut = new(pathRepository, findingRepository, new InMemoryCutPointRepository());

        PagedResponse<SecurityEvidencePathSummaryResponse> filtered = await sut.ListPathsAsync(
            scope,
            SnapshotId,
            PathKind.Privilege,
            PathConfidenceBand.Probable,
            CloudResourceId,
            page: 1,
            pageSize: 50,
            CancellationToken.None);

        filtered.Items.Should().ContainSingle();
        filtered.Items[0].PathId.Should().Be(PathId);

        PagedResponse<SecurityEvidencePathSummaryResponse> empty = await sut.ListPathsAsync(
            scope,
            Guid.Parse("00000000-0000-0000-0000-000000000099"),
            null,
            null,
            null,
            page: 1,
            pageSize: 50,
            CancellationToken.None);

        empty.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task TryGetPathDetailAsync_finding_citation_round_trip()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository pathRepository = CreateSamplePathRepository();
        InMemoryFindingRepository findingRepository = new();
        findingRepository.StoredFindings.Add(CreateFinding(FindingId, PathId, CloudResourceId));

        SecurityEvidencePathInspectorQueryService sut = new(pathRepository, findingRepository, new InMemoryCutPointRepository());

        SecurityEvidencePathDetailResponse? detail = await sut.TryGetPathDetailAsync(scope, PathId, CancellationToken.None);

        detail.Should().NotBeNull();
        detail!.CitingFindingIds.Should().Contain(FindingId);

        OperationalSecurityFindingRecord? finding = findingRepository.StoredFindings.Single();
        finding.PathId.Should().Be(PathId);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static InMemoryPathRepository CreateSamplePathRepository()
    {
        InMemoryPathRepository repository = new();
        DateTime utcNow = DateTime.UtcNow;

        repository.StoredPaths.Add(new SecurityEvidencePathRecord
        {
            PathId = PathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = SnapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Probable,
            CanonicalHopHashSha256 = [1, 2, 3],
            WeakestHopOrdinal = 2,
            WeakestHopReason = "Derived CAN_READ hop uses Probable confidence.",
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        });

        repository.StoredHops.AddRange(
        [
            new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = PathId,
                TenantId = TenantId,
                HopOrdinal = 1,
                FromNodeId = "azure-ad://principal/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                ToNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                EdgeType = GraphEdgeTypes.HasRole,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                HopConfidenceBand = PathConfidenceBand.Confirmed,
                InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment,
                EvidenceReference = $"snapshot:{SnapshotId:D}:HAS_ROLE",
            },
            new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = PathId,
                TenantId = TenantId,
                HopOrdinal = 2,
                FromNodeId = "azure-ad://principal/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                ToNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                EdgeType = GraphEdgeTypes.CanRead,
                ProvenanceKind = ProvenanceKind.DerivedFact,
                HopConfidenceBand = PathConfidenceBand.Probable,
                InferenceSource = GraphEdgeInferenceSources.InventoryRbacDataPlaneMap,
                EvidenceReference = $"snapshot:{SnapshotId:D}:CAN_READ",
                CloudResourceId = CloudResourceId,
            },
        ]);

        return repository;
    }

    private static OperationalSecurityFindingRecord CreateFinding(Guid findingId, Guid pathId, Guid cloudResourceId) =>
        new()
        {
            FindingId = findingId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = Contracts.Common.CloudProvider.Azure,
            SourceSystem = SecureNowArchitectConstants.SourceSystem,
            SourceFindingId = "sample-finding",
            PathId = pathId,
            CloudResourceId = cloudResourceId,
            Title = "Privilege path",
            Severity = "Medium",
            Status = OperationalSecurityFindingStatus.Open,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
            FirstObservedUtc = DateTime.UtcNow,
            LastObservedUtc = DateTime.UtcNow,
            PayloadHashSha256 = [9, 9, 9],
        };

    private sealed class InMemoryPathRepository : ISecurityEvidencePathRepository
    {
        public List<SecurityEvidencePathRecord> StoredPaths { get; } = [];

        public List<SecurityEvidencePathHopRecord> StoredHops { get; } = [];

        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            SecurityEvidencePathRecord? match = StoredPaths.FirstOrDefault(path =>
                path.TenantId == tenantId && path.PathId == pathId);

            return Task.FromResult(match);
        }

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<SecurityEvidencePathRecord?>(null);

        public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> hops = StoredHops
                .Where(hop => hop.TenantId == tenantId && hop.PathId == pathId)
                .OrderBy(static hop => hop.HopOrdinal)
                .ToList();

            return Task.FromResult(hops);
        }

        public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
            SecurityEvidencePathRecord pathHeader,
            IReadOnlyList<SecurityEvidencePathHopRecord> hops,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new SecurityEvidencePathInsertResult { PathId = pathHeader.PathId, Created = true });

        public Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            SecurityEvidencePathListFilter filter,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<SecurityEvidencePathRecord> query = StoredPaths.Where(path =>
                path.TenantId == tenantId
                && path.WorkspaceId == workspaceId
                && path.ProjectId == projectId);

            if (filter.SnapshotId.HasValue)
            {
                query = query.Where(path => path.SnapshotId == filter.SnapshotId.Value);
            }

            if (filter.PathKind.HasValue)
            {
                query = query.Where(path => path.PathKind == filter.PathKind.Value);
            }

            if (filter.ConfidenceBand.HasValue)
            {
                query = query.Where(path => path.PathConfidenceBand == filter.ConfidenceBand.Value);
            }

            if (filter.CloudResourceId.HasValue)
            {
                HashSet<Guid> pathIds = StoredHops
                    .Where(hop => hop.CloudResourceId == filter.CloudResourceId.Value)
                    .Select(static hop => hop.PathId)
                    .ToHashSet();

                query = query.Where(path => pathIds.Contains(path.PathId));
            }

            List<SecurityEvidencePathRecord> all = query.ToList();

            return Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)>(
                (all, all.Count));
        }

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityEvidencePathRecord>>(
                StoredPaths
                    .Where(path =>
                        path.TenantId == tenantId
                        && path.WorkspaceId == workspaceId
                        && path.ProjectId == projectId
                        && path.SnapshotId == snapshotId)
                    .ToList());
    }

    private sealed class InMemoryFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> StoredFindings { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            Contracts.Common.CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(StoredFindings.ToList());

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<Guid> ids = StoredFindings
                .Where(finding => finding.TenantId == tenantId && finding.PathId == pathId)
                .Select(static finding => finding.FindingId)
                .ToList();

            return Task.FromResult(ids);
        }

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class InMemoryCutPointRepository : ISecurityEvidenceCutPointRepository
    {
        public Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidenceCutPointRecord>>([]);

        public Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidenceCutPointRecord>>([]);

        public Task ReplaceCutPointsForSnapshotAsync(
            Guid tenantId,
            Guid snapshotId,
            IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
