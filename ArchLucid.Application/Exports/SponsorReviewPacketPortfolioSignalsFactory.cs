using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Exports;

/// <summary>Maps live sponsor ROI fields into sponsor packet portfolio signals (TB-104).</summary>
public static class SponsorReviewPacketPortfolioSignalsFactory
{
    public static SponsorReviewPacketPortfolioSignals Create(SponsorRoiSummaryResponse roiSummary)
    {
        ArgumentNullException.ThrowIfNull(roiSummary);

        List<string> nextActions = [];
        const string derivedFromAmountsPrefix = "Derived from disposition amounts: ";

        if (roiSummary.BasisBreakdown?.DeferredUsd > 0m)
        {
            nextActions.Add(
                $"{derivedFromAmountsPrefix}Review deferred findings before the next architecture board cycle.");
        }

        if (roiSummary.BasisBreakdown?.WaivedUsd > 0m)
        {
            nextActions.Add(
                $"{derivedFromAmountsPrefix}Confirm active waivers remain within policy before sponsor distribution.");
        }

        return new SponsorReviewPacketPortfolioSignals
        {
            ResolvedFindingsCount30Days = roiSummary.ResolvedFindingsCount30Days,
            NewlyDiscoveredFindingsCount30Days = roiSummary.NewlyDiscoveredFindingsCount30Days,
            StaleRiskCount = roiSummary.StaleArchitectureRiskCount,
            ExpiringWaiversCount14Days = roiSummary.ExpiringWaiversCount14Days,
            NextActions = nextActions,
        };
    }
}
