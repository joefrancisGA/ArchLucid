using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Contracts.Pilots;

/// <summary>Shared PASS / WARN / HOLD copy for sponsor ROI surfaces (Markdown, PDF, DOCX).</summary>
public static class SponsorRoiClaimDispositionRules
{
    public static SponsorRoiClaimDisposition FromReviewCycleProvenance(ReviewCycleBaselineProvenance provenance)
    {
        return provenance switch
        {
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup or ReviewCycleBaselineProvenance.TenantSuppliedViaSettings =>
                SponsorRoiClaimDisposition.Warn,
            ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions => SponsorRoiClaimDisposition.Warn,
            ReviewCycleBaselineProvenance.NoMeasurementYet or _ => SponsorRoiClaimDisposition.Hold,
        };
    }

    public static string DescribeLeadLine(SponsorRoiClaimDisposition disposition)
    {
        return disposition switch
        {
            SponsorRoiClaimDisposition.Pass =>
                "**PASS** — buyer-provided ROI baselines support comparative narratives; human redaction still required before external send.",
            SponsorRoiClaimDisposition.Warn =>
                "**WARN** — ROI narratives must carry estimate labels; do not lead sponsor readouts with projected dollar savings.",
            SponsorRoiClaimDisposition.Hold =>
                "**HOLD** — suppress projected dollar ROI claims; use qualitative deltas only until buyer baselines are collected.",
            _ => throw new ArgumentOutOfRangeException(nameof(disposition), disposition, null),
        };
    }

    public static string DescribeAnnualizedSectionQualifier(SponsorRoiClaimDisposition disposition)
    {
        return disposition switch
        {
            SponsorRoiClaimDisposition.Pass =>
                "Annualized figures may be shared externally only after human redaction and buyer baseline confirmation.",
            SponsorRoiClaimDisposition.Warn =>
                "Annualized figures are estimate-basis planning numbers — not customer-specific savings claims.",
            SponsorRoiClaimDisposition.Hold =>
                "Annualized ROI figures are internal planning only — do not include in sponsor-facing materials.",
            _ => throw new ArgumentOutOfRangeException(nameof(disposition), disposition, null),
        };
    }
}
