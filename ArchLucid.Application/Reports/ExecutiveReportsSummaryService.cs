using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Reports;

/// <summary>Live <see cref="ExecutiveSummaryResult"/> for <c>/v1/reports/executive-summary</c> (TB-062).</summary>
public sealed class ExecutiveReportsSummaryService(
    IScopeContextProvider scopeProvider,
    IExecutiveRoiSummaryService roiSummaryService,
    IGovernanceDigestDecisionNeededComposer decisionsNeededComposer) : IExecutiveReportsSummaryService
{
    public async Task<ExecutiveSummaryResult> BuildAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        ExecutiveRoiSummaryResponse roi = await roiSummaryService.BuildAsync(cancellationToken);

        Contracts.Governance.GovernanceDecisionsNeededSummaryResponse decisions =
            await decisionsNeededComposer.BuildSummaryAsync(scope.TenantId, scope.ProjectId, cancellationToken);

        int securityCount = roi.TopSystemicIssues
            .Count(static i => string.Equals(i.Category, "Security", StringComparison.OrdinalIgnoreCase));

        int reliabilityCount = roi.TopSystemicIssues
            .Count(static i => string.Equals(i.Category, "Reliability", StringComparison.OrdinalIgnoreCase));

        return new ExecutiveSummaryResult
        {
            TotalCostSavingsUsd = roi.TotalEstimatedUsdSavings,
            TotalRiskReductionScore = decisions.TotalDecisionItems,
            UniqueFindingCount = roi.TopSystemicIssues.Count,
            RawFindingCount = roi.LatestRunCount,
            CostWasteUsd = roi.TotalEstimatedUsdSavings,
            SecurityRiskCount = securityCount,
            ReliabilityGapCount = reliabilityCount,
        };
    }
}
