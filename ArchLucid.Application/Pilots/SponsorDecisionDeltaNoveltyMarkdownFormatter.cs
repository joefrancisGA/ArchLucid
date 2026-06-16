using System.Globalization;
using System.Text;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Emits mandatory sponsor-facing decision-delta and novelty-confidence sections for first-value exports.
/// </summary>
public static class SponsorDecisionDeltaNoveltyMarkdownFormatter
{
    public static void AppendMarkdownSections(StringBuilder sb, SponsorDecisionDeltaNoveltyResult result)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(result);

        sb.AppendLine(SponsorDecisionDeltaNoveltyResolver.DecisionDeltaSectionHeading);
        sb.AppendLine();
        sb.AppendLine(
            "What changed in the recommended architecture decision posture for this review package (derived from active findings — not a market claim).");
        sb.AppendLine();
        sb.AppendLine(result.DecisionDeltaSummary);
        sb.AppendLine();
        sb.AppendLine("**Why this may be non-obvious:**");
        sb.AppendLine();
        sb.AppendLine(result.NonObviousRationale);
        sb.AppendLine();
        sb.AppendLine(SponsorDecisionDeltaNoveltyResolver.NoveltyConfidenceSectionHeading);
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Confidence:** **{FormatNoveltyConfidence(result.NoveltyConfidence)}**");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Evidence class:** {result.EvidenceClassLabel}");
        sb.AppendLine();
        sb.AppendLine("**Confidence basis:**");
        sb.AppendLine();
        sb.AppendLine(result.ConfidenceBasisSummary);
        sb.AppendLine();
        sb.AppendLine(
            "> Novelty confidence describes **product-attested insight posture** for this run — not published blind-validation scores or third-party endorsements.");
        sb.AppendLine();
    }

    private static string FormatNoveltyConfidence(SponsorNoveltyConfidence confidence) =>
        confidence switch
        {
            SponsorNoveltyConfidence.Strong => "Strong",
            SponsorNoveltyConfidence.Partial => "Partial",
            SponsorNoveltyConfidence.Low => "Low",
            SponsorNoveltyConfidence.NotAssessed => "Not assessed",
            _ => "Not assessed",
        };
}
