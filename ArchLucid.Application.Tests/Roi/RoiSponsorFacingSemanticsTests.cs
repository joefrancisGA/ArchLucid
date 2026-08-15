using ArchLucid.Application.Governance;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

/// <summary>Cross-surface ROI scope label consistency (T2-6).</summary>
[Trait("Suite", "Core")]
public sealed class RoiSponsorFacingSemanticsTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task Executive_roi_summary_and_reports_summary_share_headline_scope_labels()
    {
        SponsorRoiSummaryResponse roi = new()
        {
            TotalEstimatedUsdSavings = 10_000m,
            ResolvedFindingsCount30Days = 3,
            LatestRunCount = 2,
            TopSystemicIssues = [],
        };

        RoiSponsorFacingScopeLabeler.ApplySponsorRoiSummary(roi);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(provider => provider.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<ISponsorRoiSummaryService> roiService = new();
        roiService.Setup(service => service.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(roi);

        Mock<IGovernanceDigestDecisionNeededComposer> decisions = new();
        decisions
            .Setup(composer => composer.BuildSummaryAsync(TenantId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Contracts.Governance.GovernanceDecisionsNeededSummaryResponse());

        SponsorReportsSummaryService sut = new(scope.Object, roiService.Object, decisions.Object);

        SponsorReportResult reports = await sut.BuildAsync(CancellationToken.None);

        reports.HeadlineSavingsScopeCode.Should().Be(roi.HeadlineSavingsScopeCode);
        reports.HeadlineSavingsScopeDescription.Should().Be(roi.HeadlineSavingsScopeDescription);
        reports.Trailing30DayActivityScopeDescription.Should().Be(roi.Trailing30DayActivityScopeDescription);
        reports.TotalCostSavingsUsd.Should().Be(roi.TotalEstimatedUsdSavings);
    }

    [Fact]
    public void Cross_tenant_portfolio_uses_distinct_scope_code_from_single_tenant_headline()
    {
        CrossTenantPortfolioSummaryResponse portfolio = new()
        {
            IsKAnonymitySatisfied = true,
            TotalEstimatedUsdSavings = 25_000m,
        };

        RoiSponsorFacingScopeLabeler.ApplyCrossTenantPortfolio(portfolio);

        SponsorRoiSummaryResponse tenant = new();
        RoiSponsorFacingScopeLabeler.ApplySponsorRoiSummary(tenant);

        portfolio.HeadlineSavingsScopeCode.Should().Be(RoiSponsorFacingScopeCodes.CrossTenantPortfolioHeadline);
        tenant.HeadlineSavingsScopeCode.Should().Be(RoiSponsorFacingScopeCodes.HeadlineDispositionAware);
        portfolio.HeadlineSavingsScopeDescription.Should().NotBe(tenant.HeadlineSavingsScopeDescription);
        portfolio.HeadlineSavingsScopeDescription.Should().Contain("Cross-tenant");
        tenant.SystemRowSavingsScopeDescription.Should().Contain("do not sum");
    }

    [Fact]
    public async Task BuildAsync_populates_scope_labels_on_executive_roi_summary()
    {
        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, (string?)null));

        SponsorRoiSummaryService service = SponsorRoiSummaryServiceTestSupport.CreateService(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            scope: new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId }).Service;

        SponsorRoiSummaryResponse response = await service.BuildAsync(CancellationToken.None);

        response.HeadlineSavingsScopeCode.Should().Be(RoiSponsorFacingScopeCodes.HeadlineDispositionAware);
        response.SystemRowSavingsScopeCode.Should().Be(RoiSponsorFacingScopeCodes.SystemRowSnapshotPotential);
        response.Trailing30DayActivityScopeDescription.Should().Be(RoiSponsorFacingScopeDescriptions.Trailing30DayFindingEvents);
    }

    [Fact]
    public void Value_report_window_description_is_distinct_from_executive_headline_description()
    {
        DateTimeOffset from = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset to = new(2026, 6, 1, 0, 0, 0, TimeSpan.Zero);

        string valueReport = RoiSponsorFacingScopeDescriptions.ForValueReportWindow(from, to);

        valueReport.Should().Contain("activity window");
        valueReport.Should().Contain("Distinct from sponsor-report");
        valueReport.Should().NotBe(RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware);
    }
}
