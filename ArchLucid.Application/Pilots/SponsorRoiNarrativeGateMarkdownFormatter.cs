using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Explicit PASS / WARN / HOLD ROI narrative gate for sponsor-facing Markdown exports.</summary>
public static class SponsorRoiNarrativeGateMarkdownFormatter
{
    public static void AppendMarkdownSection(StringBuilder sb, SponsorRoiClaimDispositionResult gate)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(gate);

        sb.AppendLine("## ROI narrative claim gate");
        sb.AppendLine();
        sb.AppendLine(
            "**Indicator:** Presentation guardrail derived from persisted ROI baseline posture — not a financial attestation.");
        sb.AppendLine();
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Disposition:** {gate.DispositionLeadLine}");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Evidence confidence:** **{gate.EvidenceConfidence}** · **Basis class:** {gate.BasisClassSummary}");
        sb.AppendLine();
        sb.AppendLine($"> {gate.NarrativeBlock}");
        sb.AppendLine();
    }
}
