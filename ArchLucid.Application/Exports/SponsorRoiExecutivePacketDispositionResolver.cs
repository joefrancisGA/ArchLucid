using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Exports;

/// <summary>Maps sponsor ROI summary evidence signals to sponsor claim disposition (presentation only).</summary>
public static class SponsorRoiExecutivePacketDispositionResolver
{
    public static SponsorRoiClaimDisposition Resolve(SponsorRoiSummaryResponse roiSummary)
    {
        ArgumentNullException.ThrowIfNull(roiSummary);

        if (string.Equals(roiSummary.SavingsPricingBasis, SponsorRoiSavingsPricingBasis.HeuristicFallback, StringComparison.Ordinal))
            return SponsorRoiClaimDisposition.Hold;

        if (string.Equals(roiSummary.CostEvidenceFreshnessStatus, RoiCostEvidenceFreshness.Missing, StringComparison.OrdinalIgnoreCase))
            return SponsorRoiClaimDisposition.Hold;

        if (string.Equals(roiSummary.CostEvidenceFreshnessStatus, RoiCostEvidenceFreshness.Stale, StringComparison.OrdinalIgnoreCase))
            return SponsorRoiClaimDisposition.Warn;

        if (string.Equals(roiSummary.SavingsPricingBasis, SponsorRoiSavingsPricingBasis.UploadedActualAmortized, StringComparison.Ordinal))
            return SponsorRoiClaimDisposition.Pass;

        return SponsorRoiClaimDisposition.Warn;
    }
}
