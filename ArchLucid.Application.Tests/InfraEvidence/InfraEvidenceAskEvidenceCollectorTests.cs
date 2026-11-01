using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfraEvidenceAskEvidenceCollectorTests
{
    [Fact]
    public async Task CollectRankedPathEvidenceAsync_loads_stored_path_hops_rank_and_cut_point()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid pathId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        Guid hopId = Guid.NewGuid();
        Guid cutPointId = Guid.NewGuid();

        SecurityEvidencePathRecord path = new()
        {
            PathId = pathId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            SnapshotId = snapshotId,
        };

        Mock<ISecurityEvidencePathRepository> paths = new();
        paths
            .Setup(repository => repository.TryGetByIdAsync(
                tenantId,
                pathId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(path);
        paths
            .Setup(repository => repository.ListHopsByPathAsync(
                tenantId,
                pathId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new SecurityEvidencePathHopRecord
                {
                    HopRowId = hopId,
                    PathId = pathId,
                    HopOrdinal = 1,
                    FromNodeId = "source",
                    ToNodeId = "target",
                    EdgeType = "PrivateLink",
                },
            ]);

        Mock<ISecurityEvidencePathRankRepository> ranks = new();
        ranks
            .Setup(repository => repository.TryGetRankAsync(
                tenantId,
                pathId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SecurityEvidencePathRankRecord
            {
                PathId = pathId,
                TenantId = tenantId,
                SnapshotId = snapshotId,
                RuleVersion = "rank-v1",
                TechnicalExposureScore = 8,
                PrivilegeDepthScore = 7,
                BlastRadiusScore = 6,
                ConfidenceBandScore = 5,
                CompositeSortScore = 4,
                RankOrder = 1,
                ExplanationSummary = "stored rank",
            });

        Mock<ISecurityEvidenceCutPointRepository> cutPoints = new();
        cutPoints
            .Setup(repository => repository.ListByPathIdAsync(
                tenantId,
                pathId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new SecurityEvidenceCutPointRecord
                {
                    CutPointId = cutPointId,
                    TenantId = tenantId,
                    SnapshotId = snapshotId,
                    CutOrder = 1,
                    CutKey = "source->target",
                    LeverageScore = 3,
                    PathsCollapsedCount = 2,
                },
            ]);

        InfraEvidenceAskEvidenceCollector collector = new(
            Mock.Of<ICloudResourceEvidenceHubService>(),
            Mock.Of<IAzureInventoryDriftClassificationService>(),
            Mock.Of<IDiagramInfrastructureReconciliationService>(),
            Mock.Of<IAzureInventorySnapshotRepository>(),
            Mock.Of<IAuditEvidenceLineageService>(),
            paths.Object,
            ranks.Object,
            cutPoints.Object);

        InfraEvidenceAskEvidenceBundle bundle = await collector.CollectAsync(
            new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
            },
            new InfraEvidenceAskRequest
            {
                Question = "Explain this ranked path.",
                SecurityEvidencePathId = pathId,
                SnapshotId = snapshotId,
            },
            InfraEvidenceAskTopicKinds.RankedPath,
            CancellationToken.None);

        bundle.Citations.Select(citation => citation.Kind).Should().Equal(
            InfraEvidenceAskCitationKinds.SecurityEvidencePathId,
            InfraEvidenceAskCitationKinds.SecurityEvidencePathHopId,
            InfraEvidenceAskCitationKinds.SecurityEvidencePathRankId,
            InfraEvidenceAskCitationKinds.SecurityEvidenceCutPointId);
        bundle.EvidenceLines.Should().Contain(line => line.Contains("compositeSortScore=4", StringComparison.Ordinal));
        bundle.EvidenceLines.Should().Contain(line => line.Contains("cutPointId=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectHubEvidenceAsync_caps_operational_findings_and_records_omission()
    {
        Guid cloudResourceId = Guid.NewGuid();
        List<CloudResourceEvidenceFindingHubItem> findings = [];

        for (int index = 0; index < 55; index++)
        {
            findings.Add(new CloudResourceEvidenceFindingHubItem
            {
                Id = $"finding-{index}",
                Title = $"Finding {index}",
                StreamKind = "operational",
            });
        }

        CloudResourceEvidenceHubResponse hub = new()
        {
            ExternalResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
            OperationalSecurityFindings = new CloudResourceEvidenceFindingStreamPage { Items = findings },
            ArchitectureReviewFindings = new CloudResourceEvidenceFindingStreamPage(),
            RemediationInstances = new CloudResourceRemediationStreamPage(),
            RecentChanges = [],
        };

        Mock<ICloudResourceEvidenceHubService> hubService = new();
        hubService
            .Setup(service => service.TryGetHubAsync(
                It.IsAny<ScopeContext>(),
                cloudResourceId,
                It.IsAny<CloudResourceEvidenceHubQuery>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudResourceEvidenceHubQueryResult
            {
                Succeeded = true,
                Hub = hub,
            });

        InfraEvidenceAskEvidenceCollector collector = new(
            hubService.Object,
            Mock.Of<IAzureInventoryDriftClassificationService>(),
            Mock.Of<IDiagramInfrastructureReconciliationService>(),
            Mock.Of<IAzureInventorySnapshotRepository>(),
            Mock.Of<IAuditEvidenceLineageService>(),
            Mock.Of<ISecurityEvidencePathRepository>(),
            Mock.Of<ISecurityEvidencePathRankRepository>(),
            Mock.Of<ISecurityEvidenceCutPointRepository>());

        InfraEvidenceAskEvidenceBundle bundle = await collector.CollectAsync(
            new ScopeContext(),
            new InfraEvidenceAskRequest { CloudResourceId = cloudResourceId, Question = "Summarize findings" },
            InfraEvidenceAskTopicKinds.ResourceOverview,
            CancellationToken.None);

        bundle.Citations.Should().HaveCount(InfraEvidenceAskPromptBuilder.AskEvidenceRowCap);
        bundle.EvidenceLines.Should().Contain(line =>
            line.Contains("operational security finding row(s)", StringComparison.Ordinal)
            && line.Contains("ask bundle", StringComparison.Ordinal));
    }
}
