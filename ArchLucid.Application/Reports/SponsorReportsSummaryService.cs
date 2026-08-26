using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Reports;

/// <summary>Live <see cref="SponsorReportResult"/> for <c>/v1/reports/sponsor-report</c> (TB-062).</summary>
public sealed class SponsorReportsSummaryService(
    IScopeContextProvider scopeProvider,
    ISponsorRoiSummaryService roiSummaryService,
    IGovernanceDigestDecisionNeededComposer decisionsNeededComposer) : ISponsorReportsSummaryService
{
    public async Task<SponsorReportResult> BuildAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        SponsorRoiSummaryResponse roi = await roiSummaryService.BuildAsync(cancellationToken);

        Contracts.Governance.GovernanceDecisionsNeededSummaryResponse decisions =
            await decisionsNeededComposer.BuildSummaryAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken);

        int securityCount = roi.TopSystemicIssues
            .Count(static i => string.Equals(i.Category, "Security", StringComparison.OrdinalIgnoreCase));

        int reliabilityCount = roi.TopSystemicIssues
            .Count(static i => string.Equals(i.Category, "Reliability", StringComparison.OrdinalIgnoreCase));

        return new SponsorReportResult(
            TotalCostSavingsUsd: roi.TotalEstimatedUsdSavings,
            TotalRiskReductionScore: roi.ResolvedFindingsCount30Days,
            UniqueFindingCount: roi.TopSystemicIssues.Count,
            RawFindingCount: roi.LatestRunCount,
            CostWasteUsd: null,
            SecurityRiskCount: securityCount,
            ReliabilityGapCount: reliabilityCount,
            PendingGovernanceDecisionCount: decisions.TotalDecisionItems,
            HeadlineSavingsScopeCode: roi.HeadlineSavingsScopeCode,
            HeadlineSavingsScopeDescription: roi.HeadlineSavingsScopeDescription,
            Trailing30DayActivityScopeDescription: roi.Trailing30DayActivityScopeDescription);
    }
}
