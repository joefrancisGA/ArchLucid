using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CutPointAnalysisEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid SnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task RunAsync_empty_snapshot_clears_cut_points_without_error()
    {
        ScopeContext scope = CreateScope();
        InMemoryPathRepository pathRepository = new();
        InMemoryRankRepository rankRepository = new();
        InMemoryCutPointRepository cutPointRepository = new();

        CutPointAnalysisEngine sut = new(
            pathRepository,
            rankRepository,
            cutPointRepository,
            new Mock<IAzureInventorySnapshotRepository>().Object,
            new InMemoryPatternRepository(),
            NullLogger<CutPointAnalysisEngine>.Instance);

        CutPointAnalysisEngineResult result = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.CutPointsDiscovered.Should().Be(0);
        cutPointRepository.LastReplacedSnapshotId.Should().Be(SnapshotId);
        cutPointRepository.LastReplacedCutPoints.Should().BeEmpty();
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private sealed class InMemoryPathRepository : ISecurityEvidencePathRepository
    {
        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRecord?>(null);

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
            => Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>([]);

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
        public Task<SecurityEvidencePathRankRecord?> TryGetRankAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRankRecord?>(null);

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
            => Task.FromResult<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)>(([], 0));

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
        public Guid? LastReplacedSnapshotId
        {
            get;
            private set;
        }

        public IReadOnlyList<SecurityEvidenceCutPointRecord> LastReplacedCutPoints
        {
            get;
            private set;
        } = [];

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
        {
            LastReplacedSnapshotId = snapshotId;
            LastReplacedCutPoints = cutPoints.ToList();
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryPatternRepository : IRemediationPatternRepository
    {
        public Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<RemediationPatternRecord?> TryGetPatternByIdAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<RemediationPatternRecord?>(null);

        public Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(
            Guid tenantId,
            string patternKey,
            CancellationToken cancellationToken = default)
            => Task.FromResult<RemediationPatternRecord?>(null);

        public Task<RemediationPatternVersionRecord?> TryGetVersionAsync(
            Guid tenantId,
            Guid patternId,
            string version,
            CancellationToken cancellationToken = default)
            => Task.FromResult<RemediationPatternVersionRecord?>(null);

        public Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<RemediationPatternRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<RemediationPatternVersionRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternApprovedVersionRecord>> ListApprovedVersionsForTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<RemediationPatternApprovedVersionRecord>>([]);
    }
}
