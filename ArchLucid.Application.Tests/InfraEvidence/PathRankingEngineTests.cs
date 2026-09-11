using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class PathRankingEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid SnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid PathId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private const string SubscriptionId = "66666666-6666-6666-6666-666666666666";

    [Fact]
    public async Task RunAsync_loads_defender_posture_for_blast_radius_ranking()
    {
        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        SecurityEvidencePathRecord path = new()
        {
            PathId = PathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = SnapshotId,
            PathKind = PathKind.ToxicCombination,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = PathId,
                TenantId = TenantId,
                HopOrdinal = 1,
                FromNodeId = SecureNowArchitectConstants.InternetPublicExposureNodeId,
                ToNodeId = "resource:storage/sa1",
                EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                HopConfidenceBand = PathConfidenceBand.Confirmed,
                EvidenceReference = "test:public",
            },
        ];

        Mock<ISecurityEvidencePathRepository> pathRepository = new();
        pathRepository
            .Setup(repository => repository.ListBySnapshotAsync(
                TenantId,
                WorkspaceId,
                ProjectId,
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([path]);
        pathRepository
            .Setup(repository => repository.ListHopsByPathAsync(TenantId, PathId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(hops);

        List<SecurityEvidencePathRankRecord> persistedRanks = [];
        Mock<ISecurityEvidencePathRankRepository> rankRepository = new();
        rankRepository
            .Setup(repository => repository.TryGetWeightsAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SecurityEvidencePathRankWeightsRecord?)null);
        rankRepository
            .Setup(repository => repository.ReplaceRanksForSnapshotAsync(
                TenantId,
                SnapshotId,
                It.IsAny<IReadOnlyList<SecurityEvidencePathRankRecord>>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, IReadOnlyList<SecurityEvidencePathRankRecord>, CancellationToken>(
                (_, _, ranks, _) => persistedRanks.AddRange(ranks))
            .Returns(Task.CompletedTask);

        Mock<ISecurityAssetAssertionResolver> assertionResolver = new();
        assertionResolver
            .Setup(resolver => resolver.GetActiveCrownJewelAssertionIdsAsync(
                TenantId,
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = SubscriptionId,
            },
            DefenderSummaries =
            [
                new AzureInventoryDefenderSummaryReadModel
                {
                    ResourceId = $"/subscriptions/{SubscriptionId}",
                    SecureScore = 35,
                },
            ],
        };

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        PathRankingEngine engine = new(
            pathRepository.Object,
            rankRepository.Object,
            assertionResolver.Object,
            snapshotRepository.Object,
            NullLogger<PathRankingEngine>.Instance);

        PathRankingEngineResult result = await engine.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsRanked.Should().Be(1);
        persistedRanks.Should().ContainSingle();
        persistedRanks[0].BlastRadiusScore.Should().BeGreaterThan(0.75m);
    }
}
