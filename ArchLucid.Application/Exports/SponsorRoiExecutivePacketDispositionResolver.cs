using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Exports;

/// <summary>Maps executive ROI summary evidence signals to sponsor claim disposition (presentation only).</summary>
public static class SponsorRoiExecutivePacketDispositionResolver
{
    public static SponsorRoiClaimDisposition Resolve(ExecutiveRoiSummaryResponse roiSummary)
    {
        ArgumentNullException.ThrowIfNull(roiSummary);

        if (string.Equals(roiSummary.SavingsPricingBasis, ExecutiveRoiSavingsPricingBasis.HeuristicFallback, StringComparison.Ordinal))
            return SponsorRoiClaimDisposition.Hold;

        if (string.Equals(roiSummary.CostEvidenceFreshnessStatus, RoiCostEvidenceFreshness.Missing, StringComparison.OrdinalIgnoreCase))
            return SponsorRoiClaimDisposition.Hold;

        if (string.Equals(roiSummary.CostEvidenceFreshnessStatus, RoiCostEvidenceFreshness.Stale, StringComparison.OrdinalIgnoreCase))
            return SponsorRoiClaimDisposition.Warn;

        if (string.Equals(roiSummary.SavingsPricingBasis, ExecutiveRoiSavingsPricingBasis.UploadedActualAmortized, StringComparison.Ordinal))
            return SponsorRoiClaimDisposition.Pass;

        return SponsorRoiClaimDisposition.Warn;
    }
}
