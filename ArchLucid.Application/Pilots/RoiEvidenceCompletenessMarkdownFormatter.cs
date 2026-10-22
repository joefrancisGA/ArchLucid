using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>ROI evidence-confidence block appended to sponsor first-value-report Markdown alongside baseline tables.</summary>
public static class RoiEvidenceCompletenessMarkdownFormatter
{
    /// <summary>Appends a conservative sponsor-facing completeness section derived from persisted tenant ROI baseline posture.</summary>
    public static void AppendMarkdownSection(StringBuilder sb, ValueReportSnapshot snapshot)
    {
        AppendMarkdownSection(sb, snapshot, disposition: null);
    }

    /// <summary>Appends completeness section with explicit ROI narrative disposition.</summary>
    public static void AppendMarkdownSection(
        StringBuilder sb,
        ValueReportSnapshot snapshot,
        SponsorRoiClaimDispositionResult? disposition)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(snapshot);
        (string headline, string body) = Describe(snapshot, disposition);
        sb.AppendLine("## ROI evidence completeness");
        sb.AppendLine();
        sb.AppendLine(
            "**Indicator:** Quantitative deltas use ArchLucid-persisted run facts; comparative dollar narratives inherit baseline posture captured for this tenant. Summarizes **confidence** — not a financial attestation.");
        sb.AppendLine();
        sb.AppendLine($"**Status:** **{headline}**");

        if (disposition is not null)
        {
            sb.AppendLine();
            sb.AppendLine($"**Claim disposition:** {disposition.DispositionLeadLine}");
        }

        sb.AppendLine();
        sb.AppendLine(body);
        sb.AppendLine();
    }

    internal static (string Headline, string Body) Describe(ValueReportSnapshot snapshot)
    {
        return Describe(snapshot, disposition: null);
    }

    internal static (string Headline, string Body) Describe(
        ValueReportSnapshot snapshot,
        SponsorRoiClaimDispositionResult? disposition)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        PilotRoiEvidenceConfidence tier = PilotRoiEvidenceConfidenceResolver.Resolve(snapshot);
        string headline = tier.ToString();

        string body = tier switch
        {
            PilotRoiEvidenceConfidence.Strong => BuildStrongTierBody(snapshot),
            PilotRoiEvidenceConfidence.Partial =>
                "Baseline hours **default from repository ROI model assumptions** (`docs/library/PILOT_ROI_MODEL.md`). "
                + "**Do not quote customer-specific savings** without tenant-captured baselines.",
            PilotRoiEvidenceConfidence.Low or _ =>
                "No tenant baseline measurements were captured for this cohort window; treat ROI tables as "
                + "**illustrative / internal planning only** unless operators attach external baseline artefacts.",
        };

        if (disposition is not null)
            body = $"{body} {disposition.NarrativeBlock}";

        return (headline, body);
    }

    private static string BuildStrongTierBody(ValueReportSnapshot snapshot)
    {
        ReviewCycleBaselineProvenance p = snapshot.ReviewCycleBaselineProvenance;
        string prefix = p switch
        {
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup => "Tenant supplied baseline review-cycle hours at signup",
            ReviewCycleBaselineProvenance.TenantSuppliedViaSettings => "Tenant maintained baseline inputs via baseline settings",
            _ => "Tenant-captured baseline",
        };

        List<string> parts = [$"{prefix}."];

        if (snapshot.TenantBaselineReviewCycleCapturedUtc is { } cap)
            parts.Add($"**Captured UTC:** `{cap.ToString("O", CultureInfo.InvariantCulture)}`.");

        if (snapshot.TenantBaselineManualPrepHoursPerReview is { } manual)
            parts.Add($"**Manual prep hrs/review:** `{manual.ToString(CultureInfo.InvariantCulture)}`.");

        if (BaselineReviewCycleSourceMarkers.FormatReviewCycleSourceNoteForDisplay(snapshot.TenantBaselineReviewCycleSource)
            is { } noteTrimmed)
            parts.Add($"**Source note:** {noteTrimmed}");

        return string.Join(" ", parts);
    }
}
