using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Exports;

/// <summary>Maps live executive ROI fields into sponsor packet portfolio signals (TB-104).</summary>
public static class ExecutiveReviewPacketPortfolioSignalsFactory
{
    public static ExecutiveReviewPacketPortfolioSignals Create(ExecutiveRoiSummaryResponse roiSummary)
    {
        ArgumentNullException.ThrowIfNull(roiSummary);

        List<string> nextActions = [];

        if (roiSummary.BasisBreakdown?.DeferredUsd > 0m)
            nextActions.Add("Review deferred findings before the next architecture board cycle.");

        if (roiSummary.BasisBreakdown?.WaivedUsd > 0m)
            nextActions.Add("Confirm active waivers remain within policy before sponsor distribution.");

        if (nextActions.Count == 0)
            nextActions.Add("Confirm EA-adjusted savings assumptions with FinOps before sponsor sign-off.");

        return new ExecutiveReviewPacketPortfolioSignals
        {
            ResolvedFindingsCount30Days = roiSummary.ResolvedFindingsCount30Days,
            NewlyDiscoveredFindingsCount30Days = roiSummary.NewlyDiscoveredFindingsCount30Days,
            StaleRiskCount = 0,
            ExpiringWaiversCount14Days = roiSummary.ExpiringWaiversCount14Days,
            NextActions = nextActions,
        };
    }
}
