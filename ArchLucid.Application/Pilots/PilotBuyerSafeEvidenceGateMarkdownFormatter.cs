using System.Globalization;
using System.Text;

namespace ArchLucid.Application.Pilots;

/// <summary>Markdown block for the sponsor-send gate (mirrors structured evaluation; no new numeric claims).</summary>
public static class PilotBuyerSafeEvidenceGateMarkdownFormatter
{
    /// <summary>
    ///     Appends the gate section after introductory copy so PDF export (Markdown-derived) stays aligned.
    /// </summary>
    public static void AppendMarkdownSection(StringBuilder sb, PilotBuyerSafeEvidenceGateResult gate)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(gate);
        sb.AppendLine("## Sponsor send readiness (buyer-safe gate)");
        sb.AppendLine();
        sb.AppendLine("**Indicator:** Structured checklist from persisted run + tenant ROI baseline window — not a legal or financial attestation.");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Proof sendability:** **{DescribeSendability(gate.ProofSendability)}** — governs sponsor-safe distribution of this proof package; pair with **Publishing posture** below.");
        sb.AppendLine();
        sb.AppendLine(
            $"**Publishing posture:** **{DescribeTier(gate.PublishingTier)}** (Complete = no listed gaps and not demo-flagged; Partial = soft gaps only; Demo-only = demo tenant **or** structural hard gaps such as missing committed manifest / zero audit rows).");
        sb.AppendLine();

        if (gate.DemoGaps.Count is 0 && gate.HardGaps.Count is 0 && gate.SoftGaps.Count is 0)
        {
            sb.AppendLine("**Gaps:** _None detected for the checks above — still review qualitative baselines and attachments._");
            sb.AppendLine();
            return;
        }

        AppendGapSubsection(sb, "**Demo tenant blocking:**", gate.DemoGaps);
        AppendGapSubsection(sb, "**Structural blocking:**", gate.HardGaps);
        AppendGapSubsection(sb, "**Caveats:**", gate.SoftGaps);
        sb.AppendLine();
    }

    private static void AppendGapSubsection(StringBuilder sb, string heading, IReadOnlyList<string> gaps)
    {
        if (gaps.Count is 0)
            return;

        sb.AppendLine(heading);
        sb.AppendLine();
        int n = 1;

        foreach (string gap in gaps)
        {
            sb.AppendLine(CultureInfo.InvariantCulture, $"{n}. {gap}");
            n++;
        }

        sb.AppendLine();
    }

    private static string DescribeSendability(ProofPackageSendability s) => s switch
    {
        ProofPackageSendability.Sendable => "Sendable",
        ProofPackageSendability.SendableWithCaveats => "Sendable with caveats",
        ProofPackageSendability.NotSendable => "Not sendable externally",
        _ => throw new ArgumentOutOfRangeException(nameof(s), s, null)
    };

    private static string DescribeTier(PilotBuyerSafeEvidencePublishingTier tier) => tier switch
    {
        PilotBuyerSafeEvidencePublishingTier.Complete => "Complete",
        PilotBuyerSafeEvidencePublishingTier.Partial => "Partial",
        PilotBuyerSafeEvidencePublishingTier.DemoOnly => "Demo-only",
        _ => throw new ArgumentOutOfRangeException(nameof(tier), tier, null)
    };
}
