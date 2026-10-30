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
            Mock.Of<IAuditEvidenceLineageService>());

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
