using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
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
public sealed class SecurityEvidencePathRankQueryServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid SnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid PathId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [Fact]
    public async Task TryGetPathRankAsync_returns_dimension_prose_without_llm()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository pathRepository = CreateSamplePathRepository();
        InMemoryRankRepository rankRepository = new();
        rankRepository.StoredRanks[(TenantId, PathId)] = CreateSampleRank();

        SecurityEvidencePathRankQueryService sut = new(pathRepository, rankRepository, new InMemoryCutPointRepository());

        SecurityEvidencePathRankDetailResponse? detail =
            await sut.TryGetPathRankAsync(scope, PathId, CancellationToken.None);

        detail.Should().NotBeNull();
        detail!.RuleVersion.Should().Be(SecurityEvidencePathRankConstants.RuleVersion);
        detail.DimensionProse.TechnicalExposure.Should().Contain("Technical exposure");
        detail.DimensionProse.BusinessConsequence.Should().Contain("Unknown");
        detail.ExplanationSummary.Should().Contain(SecurityEvidencePathRankConstants.RuleVersion);
        detail.ExplanationSummary.Should().NotContain("%");
    }

    [Fact]
    public async Task TryGetPathRankAsync_includes_defender_posture_in_blast_radius_prose()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository pathRepository = CreateSamplePathRepository();
        InMemoryRankRepository rankRepository = new();
        rankRepository.StoredRanks[(TenantId, PathId)] = new SecurityEvidencePathRankRecord
        {
            PathId = PathId,
            TenantId = TenantId,
            SnapshotId = SnapshotId,
            RuleVersion = SecurityEvidencePathRankConstants.RuleVersion,
            TechnicalExposureScore = 1.5m,
            PrivilegeDepthScore = 2.0m,
            BlastRadiusScore = 2.25m,
            BusinessConsequenceScore = null,
            ConfidenceBandScore = 2.0m,
            CompositeSortScore = 1.8m,
            RankOrder = 1,
            ExplanationSummary = $"{SecurityEvidencePathRankConstants.RuleVersion}: sample rank.",
            BreakdownJson =
                """
                [
                  {
                    "dimension": "BlastRadius",
                    "rawScore": 2.25,
                    "weight": 0.2,
                    "weightedContribution": 0.45,
                    "source": "resources:0+defender-posture-medium"
                  }
                ]
                """,
            ComputedUtc = DateTime.UtcNow,
        };

        SecurityEvidencePathRankQueryService sut = new(pathRepository, rankRepository, new InMemoryCutPointRepository());

        SecurityEvidencePathRankDetailResponse? detail =
            await sut.TryGetPathRankAsync(scope, PathId, CancellationToken.None);

        detail.Should().NotBeNull();
        detail!.DimensionProse.BlastRadius.Should().Contain("Defender posture band is Medium");
        detail.DimensionProse.BlastRadius.Should().NotContain("%");
    }

    [Fact]
    public async Task ListRankedPathsAsync_returns_paths_in_rank_order()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository pathRepository = CreateSamplePathRepository();
        InMemoryRankRepository rankRepository = new();
        rankRepository.StoredRanks[(TenantId, PathId)] = CreateSampleRank();

        SecurityEvidencePathRankQueryService sut = new(pathRepository, rankRepository, new InMemoryCutPointRepository());

        SecurityEvidencePathRankedPageResponse page =
            await sut.ListRankedPathsAsync(scope, SnapshotId, page: 1, pageSize: 50, CancellationToken.None);

        page.Items.Should().ContainSingle();
        page.Items[0].RankOrder.Should().Be(1);
        page.Items[0].PathKind.Should().Be(PathKind.Privilege.ToString());
        page.TopCutPoints.Should().NotBeNull();
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static SecurityEvidencePathRankRecord CreateSampleRank() =>
        new()
        {
            PathId = PathId,
            TenantId = TenantId,
            SnapshotId = SnapshotId,
            RuleVersion = SecurityEvidencePathRankConstants.RuleVersion,
            TechnicalExposureScore = 1.5m,
            PrivilegeDepthScore = 2.0m,
            BlastRadiusScore = 1.0m,
            BusinessConsequenceScore = null,
            ConfidenceBandScore = 2.0m,
            CompositeSortScore = 1.8m,
            RankOrder = 1,
            ExplanationSummary = $"{SecurityEvidencePathRankConstants.RuleVersion}: sample rank.",
            BreakdownJson = "[]",
            ComputedUtc = DateTime.UtcNow,
        };

    private static InMemoryPathRepository CreateSamplePathRepository()
    {
        InMemoryPathRepository repository = new();
        DateTime utcNow = DateTime.UtcNow;
        List<SecurityEvidencePathHopRecord> hops =
        [
            new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = PathId,
                TenantId = TenantId,
                HopOrdinal = 1,
                FromNodeId = "principal:user",
                ToNodeId = "resource:sa1",
                EdgeType = GraphEdgeTypes.CanRead,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                HopConfidenceBand = PathConfidenceBand.Probable,
                EvidenceReference = "test",
            },
        ];

        SecurityEvidencePathRecord header = new()
        {
            PathId = PathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = SnapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Probable,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

        repository.StoredPaths[PathId] = validated.Path;
        repository.StoredHops[PathId] = validated.Hops.ToList();

        return repository;
    }

    private sealed class InMemoryPathRepository : ISecurityEvidencePathRepository
    {
        public Dictionary<Guid, SecurityEvidencePathRecord> StoredPaths { get; } = [];

        public Dictionary<Guid, List<SecurityEvidencePathHopRecord>> StoredHops { get; } = [];

        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            if (!StoredPaths.TryGetValue(pathId, out SecurityEvidencePathRecord? path) || path.TenantId != tenantId)
            {
                return Task.FromResult<SecurityEvidencePathRecord?>(null);
            }

            return Task.FromResult<SecurityEvidencePathRecord?>(path);
        }

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRecord?>(null);

        public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            if (!StoredHops.TryGetValue(pathId, out List<SecurityEvidencePathHopRecord>? hops))
            {
                return Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>([]);
            }

            return Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>(hops);
        }

        public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
            SecurityEvidencePathRecord pathHeader,
            IReadOnlyList<SecurityEvidencePathHopRecord> hops,
            CancellationToken cancellationToken = default)
            => Task.FromResult(new SecurityEvidencePathInsertResult { PathId = pathHeader.PathId, Created = true });

        public Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            SecurityEvidencePathListFilter filter,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidencePathRecord>>([]);
    }

    private sealed class InMemoryRankRepository : ISecurityEvidencePathRankRepository
    {
        public Dictionary<(Guid TenantId, Guid PathId), SecurityEvidencePathRankRecord> StoredRanks { get; } = [];

        public Task<SecurityEvidencePathRankRecord?> TryGetRankAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            StoredRanks.TryGetValue((tenantId, pathId), out SecurityEvidencePathRankRecord? rank);
            return Task.FromResult(rank);
        }

        public Task<IReadOnlyList<SecurityEvidencePathRankRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityEvidencePathRankRecord>>([]);

        public Task ReplaceRanksForSnapshotAsync(
            Guid tenantId,
            Guid snapshotId,
            IReadOnlyList<SecurityEvidencePathRankRecord> ranks,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)> ListRankedPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid? snapshotId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            List<SecurityEvidencePathRankRecord> items = StoredRanks.Values
                .Where(rank =>
                    rank.TenantId == tenantId
                    && (snapshotId is null || rank.SnapshotId == snapshotId))
                .OrderBy(rank => rank.RankOrder)
                .ToList();

            return Task.FromResult<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)>(
                (items, items.Count));
        }

        public Task<SecurityEvidencePathRankWeightsRecord?> TryGetWeightsAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRankWeightsRecord?>(null);

        public Task UpsertWeightsAsync(
            SecurityEvidencePathRankWeightsRecord weights,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;
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
