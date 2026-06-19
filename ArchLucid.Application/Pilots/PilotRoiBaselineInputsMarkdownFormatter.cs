using System.Text;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Appends the per-field ROI baseline posture table to first-value Markdown.</summary>
public static class PilotRoiBaselineInputsMarkdownFormatter
{
    public static void AppendMarkdownSection(StringBuilder sb, PilotRoiBaselineInputsStatusResponse inputs)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(inputs);

        sb.AppendLine("## ROI baseline inputs (per field)");
        sb.AppendLine();
        sb.AppendLine(
            "Minimum viable sponsor ROI requires buyer-provided review-cycle hours, manual prep hours per review, reviews-per-quarter cadence, and loaded architect hourly cost on the pilot scorecard. Values below are persisted posture only — not financial attestation.");
        sb.AppendLine();
        sb.AppendLine($"**Projected dollar claim disposition:** {DescribeProjectedDollarDisposition(inputs)}");
        sb.AppendLine();
        sb.AppendLine("| Baseline input | Basis status |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine(
            $"| Review-cycle hours | **{PilotRoiBaselineInputsStatusResolver.FormatBasisLabel(inputs.ReviewCycleHoursBasis)}** |");
        sb.AppendLine(
            $"| Architect prep hours / review | **{PilotRoiBaselineInputsStatusResolver.FormatBasisLabel(inputs.ArchitectPrepHoursPerReviewBasis)}** |");
        sb.AppendLine(
            $"| Evidence assembly cadence (reviews / quarter) | **{PilotRoiBaselineInputsStatusResolver.FormatBasisLabel(inputs.EvidenceAssemblyEffortBasis)}** |");
        sb.AppendLine(
            $"| Loaded architect hourly cost | **{PilotRoiBaselineInputsStatusResolver.FormatBasisLabel(inputs.ArchitectHourlyCostBasis)}** |");
        sb.AppendLine(
            $"| Projected dollar claims sponsor-safe | **{(inputs.ProjectedDollarClaimsSponsorSafe ? "Yes" : "No")}** |");
        sb.AppendLine();

        if (!inputs.ProjectedDollarClaimsSponsorSafe)
        {
            sb.AppendLine($"> {inputs.SponsorSafeFallbackCopy}");
            sb.AppendLine();
        }
    }

    private static string DescribeProjectedDollarDisposition(PilotRoiBaselineInputsStatusResponse inputs)
    {
        if (inputs.ProjectedDollarClaimsSponsorSafe)
            return "**PASS** — all minimum baseline inputs are buyer-provided.";

        if (HasBasis(inputs, PilotRoiBaselineInputBasis.DemoDerived) || HasBasis(inputs, PilotRoiBaselineInputBasis.NotCollected))
            return "**HOLD** — projected dollar ROI claims are suppressed until buyer baselines are collected.";

        return "**WARN** — projected dollar ROI claims require estimate labels until all inputs are buyer-provided.";
    }

    private static bool HasBasis(PilotRoiBaselineInputsStatusResponse inputs, PilotRoiBaselineInputBasis basis)
    {
        return inputs.ReviewCycleHoursBasis == basis
            || inputs.ArchitectPrepHoursPerReviewBasis == basis
            || inputs.EvidenceAssemblyEffortBasis == basis
            || inputs.ArchitectHourlyCostBasis == basis;
    }
}
