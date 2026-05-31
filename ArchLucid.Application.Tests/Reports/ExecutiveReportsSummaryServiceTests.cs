using ArchLucid.Application.Governance;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Reports;

[Trait("Category", "Unit")]
public sealed class ExecutiveReportsSummaryServiceTests
{
    [Fact]
    public async Task BuildAsync_maps_resolved_findings_and_pending_governance_separately()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(provider => provider.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            });

        Mock<IExecutiveRoiSummaryService> roi = new();
        roi.Setup(service => service.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new ExecutiveRoiSummaryResponse
            {
                TotalEstimatedUsdSavings = 1000m,
                ResolvedFindingsCount30Days = 7,
                LatestRunCount = 3,
                TopSystemicIssues = [],
            });

        Mock<IGovernanceDigestDecisionNeededComposer> decisions = new();
        decisions
            .Setup(composer => composer.BuildSummaryAsync(tenantId, It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new GovernanceDecisionsNeededSummaryResponse
                {
                    TotalDecisionItems = 11,
                });

        ExecutiveReportsSummaryService sut = new(scope.Object, roi.Object, decisions.Object);

        ExecutiveSummaryResult result = await sut.BuildAsync(CancellationToken.None);

        result.TotalRiskReductionScore.Should().Be(7);
        result.PendingGovernanceDecisionCount.Should().Be(11);
        result.CostWasteUsd.Should().BeNull();
    }
}
