using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPathNarrativeBuilderTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid PathId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid StorageId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid SubnetId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly byte[] CanonicalHash = Enumerable.Repeat((byte)0xAB, 32).ToArray();

    [Fact]
    public async Task TryBuildAsync_public_reachability_path_includes_pe_rollout_and_dependent_ids()
    {
        Mock<ISecurityEvidencePathRepository> pathRepository = new();
        pathRepository
            .Setup(repository => repository.TryGetByIdAsync(TenantId, PathId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateReachabilityPath());

        pathRepository
            .Setup(repository => repository.ListHopsByPathAsync(TenantId, PathId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreatePublicReachabilityHops());

        Mock<ISecurityEvidenceCutPointRepository> cutPointRepository = new();
        cutPointRepository
            .Setup(repository => repository.ListByPathIdAsync(TenantId, PathId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new SecurityEvidenceCutPointRecord
                {
                    CutPointId = Guid.NewGuid(),
                    TenantId = TenantId,
                    SnapshotId = Guid.NewGuid(),
                    CutKind = SecurityEvidenceCutPointKind.Edge,
                    CutKey = "public-network-access",
                    PathsCollapsedCount = 3,
                    OperationalCostClass = SecurityEvidenceCutPointOperationalCostClass.PrivateEndpointDns,
                    CutOrder = 1,
                    SuggestedPatternKey = "network.disable-public-storage",
                },
            ]);

        RemediationPathNarrativeBuilder sut = new(pathRepository.Object, cutPointRepository.Object);

        RemediationPathNarrative? narrative = await sut.TryBuildAsync(
            CreateScope(),
            CreateFinding(),
            CreatePatternVersion(),
            CancellationToken.None);

        narrative.Should().NotBeNull();
        narrative!.PathId.Should().Be(PathId);
        narrative.ProblemStatement.Should().Contain("Intended reachability path");
        narrative.RecommendedChangeSource.Should().Be(RemediationPathNarrativeRecommendedChangeSources.CutPoint);
        narrative.RecommendedChange.Should().Contain("public-network-access");
        narrative.AffectedDependencyCloudResourceIds.Should().BeEquivalentTo([StorageId, SubnetId]);
        narrative.BlastRadiusWarning.Should().Contain(StorageId.ToString("D"));
        narrative.BlastRadiusWarning.Should().Contain(SubnetId.ToString("D"));
        narrative.BlastRadiusWarning.Should().NotContain("may affect systems");
        narrative.SafeRolloutSteps.Should().Contain(step => step.Contains("private endpoint", StringComparison.OrdinalIgnoreCase));
        narrative.VerificationQueries.Should().Contain(query => query.StartsWith("path:hash-absent=", StringComparison.OrdinalIgnoreCase));
        narrative.VerificationQueries.Should().Contain("property:enablePublicNetworkAccess=false");
        narrative.AiInferenceSummary.Should().BeNull();
    }

    [Fact]
    public async Task TryBuildAsync_without_path_id_returns_null()
    {
        RemediationPathNarrativeBuilder sut = new(
            Mock.Of<ISecurityEvidencePathRepository>(),
            Mock.Of<ISecurityEvidenceCutPointRepository>());

        RemediationPathNarrative? narrative = await sut.TryBuildAsync(
            CreateScope(),
            CreateFinding(pathId: null),
            CreatePatternVersion(),
            CancellationToken.None);

        narrative.Should().BeNull();
    }

    private static ScopeContext CreateScope() =>
        new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

    private static OperationalSecurityFindingRecord CreateFinding(Guid? pathId = null) =>
        CreateFindingWithPathId(pathId ?? PathId);

    private static OperationalSecurityFindingRecord CreateFindingWithPathId(Guid? pathId) =>
        new()
        {
            FindingId = Guid.NewGuid(),
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = SecureNowArchitectConstants.SourceSystem,
            SourceFindingId = "finding-1",
            Title = "Public storage path",
            Severity = "High",
            Status = OperationalSecurityFindingStatus.Open,
            FirstObservedUtc = DateTime.UtcNow,
            LastObservedUtc = DateTime.UtcNow,
            PathId = pathId,
            CloudResourceId = StorageId,
        };

    private static RemediationPatternVersionRecord CreatePatternVersion() =>
        new()
        {
            VersionId = Guid.NewGuid(),
            PatternId = Guid.NewGuid(),
            TenantId = TenantId,
            Version = "1.0.0",
            Status = RemediationPatternStatus.Approved,
            ControlObjective = "Disable public network access",
            ContentJson = """{"controlObjective":"Disable public network access","execution":{"verificationQueries":["snapshot.resource.present"]}}""",
            AutomationLevel = RemediationAutomationLevel.Guided,
            AuthorActorKey = "author",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static SecurityEvidencePathRecord CreateReachabilityPath() =>
        new()
        {
            PathId = PathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = Guid.NewGuid(),
            PathKind = PathKind.IntendedReachability,
            PathConfidenceBand = PathConfidenceBand.HighlyLikely,
            CanonicalHopHashSha256 = CanonicalHash,
            WeakestHopOrdinal = 1,
            WeakestHopReason = "Public network access enabled on storage account.",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static IReadOnlyList<SecurityEvidencePathHopRecord> CreatePublicReachabilityHops() =>
    [
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = PathId,
            TenantId = TenantId,
            HopOrdinal = 0,
            FromNodeId = SecureNowArchitectConstants.InternetPublicExposureNodeId,
            ToNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
            EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.HighlyLikely,
            EvidenceReference = "snapshot",
            CloudResourceId = StorageId,
        },
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = PathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/app",
            ToNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
            EdgeType = GraphEdgeTypes.CanRead,
            ProvenanceKind = ProvenanceKind.DerivedFact,
            HopConfidenceBand = PathConfidenceBand.Probable,
            EvidenceReference = "nsg",
            CloudResourceId = SubnetId,
        },
    ];
}
