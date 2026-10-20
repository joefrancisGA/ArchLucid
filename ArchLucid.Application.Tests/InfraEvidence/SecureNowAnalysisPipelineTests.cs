using System.Diagnostics;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using Xunit.Abstractions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowAnalysisPipelineTests(ITestOutputHelper output)
{
    private static readonly ScopeContext Scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
    private static readonly Guid SnapshotId = Guid.NewGuid();
    private static readonly Guid PriorId = Guid.NewGuid();
    private const string StorageArm = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa0";

    [Theory]
    [InlineData(1000)]
    [InlineData(10000)]
    [InlineData(50000)]
    public async Task Full_pipeline_reads_once_and_preserves_paths_scores_and_cuts(int resourceCount)
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(resourceCount);
        Harness baseline = new(snapshot);
        Harness reused = new(snapshot);
        long allocationStart = GC.GetTotalAllocatedBytes();
        Stopwatch timer = Stopwatch.StartNew();
        await baseline.RunStagesAsync();
        long baselineBytes = GC.GetTotalAllocatedBytes() - allocationStart;
        long baselineMs = timer.ElapsedMilliseconds;
        allocationStart = GC.GetTotalAllocatedBytes();
        timer.Restart();
        await reused.Coordinator.OnSnapshotMaterializedAsync(Scope, SnapshotId, null);
        long reusedMs = timer.ElapsedMilliseconds;
        long reusedBytes = GC.GetTotalAllocatedBytes() - allocationStart;

        baseline.ReadCount.Should().Be(6);
        reused.ReadCount.Should().Be(1);
        reused.Paths.Should().NotBeEmpty();
        reused.PathSignatures().Should().Equal(baseline.PathSignatures());
        reused.RankSignatures().Should().Equal(baseline.RankSignatures());
        reused.CutSignatures().Should().Equal(baseline.CutSignatures());
        reused.Ranks.OrderBy(rank => rank.RankOrder).Select(rank => rank.CompositeSortScore)
            .Should().Equal(baseline.Ranks.OrderBy(rank => rank.RankOrder).Select(rank => rank.CompositeSortScore));
        output.WriteLine($"Synthetic {resourceCount:N0} resources: snapshot reads {baseline.ReadCount} -> {reused.ReadCount}; elapsed {baselineMs} -> {reusedMs} ms; process allocations {baselineBytes:N0} -> {reusedBytes:N0} bytes. In-memory evidence stores, no SQL latency; timings are informational.");

        // A separate invocation must reload enriched evidence even in the same service scope.
        await reused.Coordinator.OnSnapshotMaterializedAsync(Scope, SnapshotId, null);
        reused.ReadCount.Should().Be(2);
    }

    [Fact]
    public async Task Standalone_neighborhood_runner_shares_target_snapshot_with_three_real_engines()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(10);
        Harness harness = new(snapshot);
        SecureNowArchitectNeighborhoodRecomputeResult result = await harness.NeighborhoodRunner.RecomputeNeighborhoodAsync(
            Scope,
            new() { SnapshotAId = PriorId, SnapshotBId = SnapshotId, DiffId = Guid.NewGuid() },
            [new() { ChangeType = AzureInventoryChangeType.PermissionChanged, CloudResourceId = snapshot.Resources[0].CloudResourceId }]);
        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().BeGreaterThan(0);
        harness.ReadCount.Should().Be(1);
    }

    [Fact]
    public async Task Diff_fan_out_and_downstream_engines_reuse_both_snapshots_and_retry_gets_fresh_inputs()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(10);
        Harness harness = new(snapshot, hasPrior: true);
        await harness.Coordinator.OnSnapshotMaterializedAsync(Scope, SnapshotId, "sub");
        harness.ReadCount.Should().Be(2, "diffing, neighborhood recompute and drift share one load of each snapshot");
        harness.Paths.Should().NotBeEmpty();
        await harness.Coordinator.OnSnapshotMaterializedAsync(Scope, SnapshotId, "sub");
        harness.ReadCount.Should().Be(4);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(int count)
    {
        List<AzureInventoryResourceRecord> resources = Enumerable.Range(0, count).Select(i => new AzureInventoryResourceRecord
        {
            TenantId = Scope.TenantId, SnapshotId = SnapshotId, ResourceRowId = Guid.NewGuid(), CloudResourceId = Guid.NewGuid(),
            AzureResourceId = $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa{i}",
            ResourceType = "Microsoft.Storage/storageAccounts",
        }).ToList();
        return new()
        {
            Header = new() { SnapshotId = SnapshotId, TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId, ProjectId = Scope.ProjectId, SubscriptionId = "sub" },
            Resources = resources,
            Properties = [new() { ResourceRowId = resources[0].ResourceRowId, PropertyKey = "publicNetworkAccess", PropertyValue = "Enabled" }],
            Tags = [new() { ResourceRowId = resources[0].ResourceRowId, TagKey = "environment", TagValue = "production" }],
            Relationships = [new() { FromAzureResourceId = "principal:alice", ToAzureResourceId = StorageArm, RelationshipType = GraphEdgeTypes.CanRead, ProvenanceKind = ProvenanceKind.ObservedFact }],
            DefenderSummaries = [new() { ResourceId = "/subscriptions/sub", SecureScore = 35 }],
        };
    }

    private sealed class Harness
    {
        public int ReadCount { get; private set; }
        public List<SecurityEvidencePathWithHops> Paths { get; } = [];
        public List<SecurityEvidencePathRankRecord> Ranks { get; } = [];
        public List<SecurityEvidenceCutPointRecord> Cuts { get; } = [];
        public AzureInventorySnapshotPostMaterializeCoordinator Coordinator { get; }
        public SecureNowArchitectNeighborhoodRunner NeighborhoodRunner { get; }
        private readonly IPrivilegePathEngine _privilege;
        private readonly IIntendedReachabilityEngine _reachability;
        private readonly IToxicCombinationEngine _toxic;
        private readonly ICapabilityToFlowEngine _capability;
        private readonly ISharedControlBlastRadiusEngine _shared;
        private readonly IFourRealityDriftEngine _drift;
        private readonly IPathRankingEngine _ranking;
        private readonly ICutPointAnalysisEngine _cut;
        private readonly ISecurityEvidencePathRoutingSyncService _routing;

        public Harness(AzureInventorySnapshotDetailReadModel snapshot, bool hasPrior = false)
        {
            Mock<IAzureInventorySnapshotRepository> snapshots = new();
            snapshots.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ScopeContext _, Guid id, CancellationToken _) =>
                {
                    ReadCount++;
                    // Model allocation of new row collections on each repository read, without SQL latency.
                    return id == PriorId ? new AzureInventorySnapshotDetailReadModel
                    {
                        Header = new() { SnapshotId = PriorId, TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId, ProjectId = Scope.ProjectId, SubscriptionId = "sub" },
                        Resources = snapshot.Resources.ToList(), Tags = snapshot.Tags.ToList(),
                        Properties = [new() { ResourceRowId = snapshot.Resources[0].ResourceRowId, PropertyKey = "publicNetworkAccess", PropertyValue = "Disabled" }],
                    } : new AzureInventorySnapshotDetailReadModel
                    {
                        Header = snapshot.Header, Resources = snapshot.Resources.ToList(), Properties = snapshot.Properties.ToList(),
                        Tags = snapshot.Tags.ToList(), Relationships = snapshot.Relationships.ToList(), DefenderSummaries = snapshot.DefenderSummaries.ToList(),
                    };
                });
            snapshots.Setup(r => r.TryGetPriorMaterializedSnapshotIdAsync(It.IsAny<ScopeContext>(), "sub", SnapshotId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(hasPrior ? PriorId : null);
            snapshots.Setup(r => r.ListResourcesByCloudResourceIdsAsync(
                    It.IsAny<ScopeContext>(),
                    It.IsAny<Guid>(),
                    It.IsAny<IReadOnlyList<Guid>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync([]);
            snapshots.Setup(r => r.ListTagsByResourceRowIdsAsync(
                    It.IsAny<ScopeContext>(),
                    It.IsAny<Guid>(),
                    It.IsAny<IReadOnlyList<Guid>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync([]);
            snapshots.Setup(r => r.ListResourcesAndPropertiesByCloudResourceIdsAsync(
                    It.IsAny<ScopeContext>(),
                    It.IsAny<Guid>(),
                    It.IsAny<IReadOnlyList<Guid>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(([], []));

            Mock<ISecurityEvidencePathRepository> paths = new();
            SecurityEvidencePathInsertResult Insert(SecurityEvidencePathRecord path, IReadOnlyList<SecurityEvidencePathHopRecord> hops)
            {
                SecurityEvidencePathGuard.ValidatedPath validated = SecurityEvidencePathGuard.ValidateAndMaterialize(path, hops);
                SecurityEvidencePathWithHops? existing = Paths.FirstOrDefault(item => item.Path.SnapshotId == path.SnapshotId
                    && item.Path.CanonicalHopHashSha256.SequenceEqual(validated.Path.CanonicalHopHashSha256));

                if (existing is not null)
                    return new() { PathId = existing.Path.PathId, Created = false };
                Paths.Add(new(validated.Path, validated.Hops));
                return new() { PathId = validated.Path.PathId, Created = true };
            }
            paths.Setup(r => r.InsertIfNotExistsAsync(It.IsAny<SecurityEvidencePathRecord>(), It.IsAny<IReadOnlyList<SecurityEvidencePathHopRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((SecurityEvidencePathRecord path, IReadOnlyList<SecurityEvidencePathHopRecord> hops, CancellationToken _) => Insert(path, hops));
            paths.Setup(r => r.InsertBatchIfNotExistsAsync(It.IsAny<IReadOnlyList<SecurityEvidencePathWithHops>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((IReadOnlyList<SecurityEvidencePathWithHops> writes, CancellationToken _) => (IReadOnlyList<SecurityEvidencePathInsertResult>)writes.Select(item => Insert(item.Path, item.Hops)).ToList());
            paths.Setup(r => r.ListWithHopsBySnapshotAsync(It.IsAny<ProjectSnapshotScopeKey>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ProjectSnapshotScopeKey key, CancellationToken _) => (IReadOnlyList<SecurityEvidencePathWithHops>)Paths.Where(item => item.Path.SnapshotId == key.SnapshotId).ToList());
            paths.Setup(r => r.ListBySnapshotAsync(It.IsAny<ProjectSnapshotScopeKey>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ProjectSnapshotScopeKey key, CancellationToken _) => (IReadOnlyList<SecurityEvidencePathRecord>)Paths.Where(item => item.Path.SnapshotId == key.SnapshotId).Select(item => item.Path).ToList());
            paths.Setup(r => r.ListHopsByPathAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid _, Guid id, CancellationToken _) => Paths.Single(item => item.Path.PathId == id).Hops);

            paths.Setup(r => r.ListHopsByPathInScopeAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ProjectScopeKey _, Guid id, CancellationToken _) => Paths.Single(item => item.Path.PathId == id).Hops);

            Mock<ISecurityEvidencePathRankRepository> ranks = new();
            ranks.Setup(r => r.ReplaceRanksForSnapshotInScopeAsync(It.IsAny<ProjectScopeKey>(), SnapshotId, It.IsAny<IReadOnlyList<SecurityEvidencePathRankRecord>>(), It.IsAny<CancellationToken>()))
                .Callback((ProjectScopeKey _, Guid _, IReadOnlyList<SecurityEvidencePathRankRecord> rows, CancellationToken _) => { Ranks.Clear(); Ranks.AddRange(rows); })
                .Returns(Task.CompletedTask);
            ranks.Setup(r => r.ListBySnapshotAsync(It.IsAny<ProjectSnapshotScopeKey>(), It.IsAny<CancellationToken>())).ReturnsAsync(() => Ranks);
            Mock<ISecurityEvidenceCutPointRepository> cuts = new();
            cuts.Setup(r => r.ReplaceCutPointsForSnapshotInScopeAsync(It.IsAny<ProjectScopeKey>(), SnapshotId, It.IsAny<IReadOnlyList<SecurityEvidenceCutPointRecord>>(), It.IsAny<CancellationToken>()))
                .Callback((ProjectScopeKey _, Guid _, IReadOnlyList<SecurityEvidenceCutPointRecord> rows, CancellationToken _) => { Cuts.Clear(); Cuts.AddRange(rows); })
                .Returns(Task.CompletedTask);
            Mock<ISecurityAssetAssertionResolver> assertions = new();
            assertions.Setup(r => r.GetActiveCrownJewelAssertionIdsAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>())).ReturnsAsync(new HashSet<Guid>());
            Mock<IRemediationPatternRepository> patterns = new();
            patterns.Setup(r => r.ListApprovedVersionsForTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
            Mock<IArchitectureDiagramReconciliationRepository> reconciliation = new();
            reconciliation.Setup(r => r.ListRunIdsBySnapshotAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
            reconciliation.Setup(r => r.ListBySnapshotAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
            Mock<IAzureInventoryDiffRepository> diffs = new();
            diffs.Setup(r => r.InsertDiffAsync(It.IsAny<ScopeContext>(), It.IsAny<AzureInventoryDiffPersistRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ScopeContext _, AzureInventoryDiffPersistRequest request, CancellationToken _) => new AzureInventoryDiffPersistResult { DiffId = request.DiffId, Summary = request.Summary });
            Mock<IOperationalSecurityFindingIngestService> findings = new();
            findings.Setup(r => r.IngestBatchAsync(It.IsAny<ScopeContext>(), It.IsAny<IReadOnlyList<OperationalSecurityFindingIngestItem>>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new OperationalSecurityFindingBatchIngestResult());

            NoOpSecurityEvidencePathSearchCoverageRepository searchCoverage = new();
            _privilege = new PrivilegePathEngine(snapshots.Object, paths.Object, findings.Object, NullLogger<PrivilegePathEngine>.Instance, searchCoverage);
            _reachability = new IntendedReachabilityEngine(snapshots.Object, paths.Object, findings.Object, NullLogger<IntendedReachabilityEngine>.Instance, searchCoverage);
            _toxic = new ToxicCombinationEngine(
                snapshots.Object,
                paths.Object,
                findings.Object,
                NullLogger<ToxicCombinationEngine>.Instance,
                searchCoverage);
            _capability = new CapabilityToFlowEngine(snapshots.Object, paths.Object, findings.Object, NullLogger<CapabilityToFlowEngine>.Instance);
            _shared = new SharedControlBlastRadiusEngine(snapshots.Object, paths.Object, findings.Object, NullLogger<SharedControlBlastRadiusEngine>.Instance);
            _drift = new FourRealityDriftEngine(snapshots.Object, diffs.Object, reconciliation.Object, paths.Object, findings.Object, NullLogger<FourRealityDriftEngine>.Instance);
            _ranking = new PathRankingEngine(paths.Object, ranks.Object, assertions.Object, snapshots.Object, NullLogger<PathRankingEngine>.Instance);
            _routing = new SecurityEvidencePathRoutingSyncService(snapshots.Object, paths.Object, Mock.Of<ISecurityEvidencePathRoutingRepository>());
            _cut = new CutPointAnalysisEngine(paths.Object, ranks.Object, cuts.Object, snapshots.Object, patterns.Object, NullLogger<CutPointAnalysisEngine>.Instance);
            NeighborhoodRunner = new(snapshots.Object, new(paths.Object), _privilege, _reachability, _toxic, Mock.Of<IAuditService>(), NullLogger<SecureNowArchitectNeighborhoodRunner>.Instance);
            Mock<IScopeContextProvider> scopes = new();
            scopes.Setup(provider => provider.GetCurrentScope()).Returns(Scope);
            IOptions<SecureNowArchitectNeighborhoodOptions> options = Options.Create(new SecureNowArchitectNeighborhoodOptions { FullRecompute = !hasPrior });
            SecureNowArchitectDiffConsumer consumer = new(scopes.Object, options, NeighborhoodRunner);
            AzureInventoryDiffService diffService = new(snapshots.Object, diffs.Object, [consumer], NullLogger<AzureInventoryDiffService>.Instance);
            Coordinator = new(snapshots.Object, diffService, options, NeighborhoodRunner, _privilege, _reachability, _toxic,
                _capability, _shared, _drift, _ranking, _cut, _routing);
        }

        public async Task RunStagesAsync()
        {
            (await _privilege.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            (await _reachability.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            (await _toxic.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            (await _capability.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            (await _shared.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            (await _drift.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            (await _ranking.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            (await _cut.RunAsync(Scope, SnapshotId, "test")).Succeeded.Should().BeTrue();
            await _routing.SyncSnapshotAsync(Scope, SnapshotId);
        }

        public IEnumerable<string> PathSignatures() => Paths.Select(item => $"{item.Path.PathKind}:{item.Path.PathConfidenceBand}:{Convert.ToHexString(item.Path.CanonicalHopHashSha256)}").Order();
        public IEnumerable<string> RankSignatures() => Ranks.Select(rank => $"{Convert.ToHexString(Paths.Single(item => item.Path.PathId == rank.PathId).Path.CanonicalHopHashSha256)}:{rank.TechnicalExposureScore}:{rank.PrivilegeDepthScore}:{rank.BlastRadiusScore}:{rank.BusinessConsequenceScore}:{rank.ConfidenceBandScore}:{rank.CompositeSortScore}").Order();
        public IEnumerable<string> CutSignatures() => Cuts.Select(cut => $"{cut.CutOrder}:{cut.CutKind}:{cut.CutKey}:{cut.PathsCollapsedCount}:{cut.OperationalCostClass}:{cut.LeverageScore}:{cut.ResourceType}").Order();
    }
}
