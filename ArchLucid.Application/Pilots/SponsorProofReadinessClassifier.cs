using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Maps <see cref="PilotBuyerSafeEvidenceGateEvaluator"/> results into a four-way sponsor label — no parallel gap rules.
/// </summary>
public static class SponsorProofReadinessClassifier
{
    /// <summary>
    ///     Fragment of <see cref="PilotBuyerSafeEvidenceGateEvaluator"/> ROI baseline soft-gap copy so
    ///     <see cref="NeedsBaseline"/> stays aligned when that is the only caveat.
    /// </summary>
    internal const string ComparativeBaselineNarrativeSoftGapToken = "ROI comparative narrative";

    public static SponsorProofReadinessClassification Classify(PilotRunDeltas deltas, PilotBuyerSafeEvidenceGateResult gate)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(gate);

        if (deltas.IsDemoTenant)
            return SponsorProofReadinessClassification.DemoOnly;

        if (gate.ProofSendability is ProofPackageSendability.NotSendable)
            return SponsorProofReadinessClassification.Incomplete;

        if (gate.ProofSendability is ProofPackageSendability.Sendable)
            return SponsorProofReadinessClassification.Sendable;

        if (gate.ProofSendability is not ProofPackageSendability.SendableWithCaveats)
            throw new ArgumentOutOfRangeException(nameof(gate), gate.ProofSendability, "Unexpected proof sendability.");

        if (gate.SoftGaps.Count > 0 && gate.SoftGaps.All(IsComparativeBaselineSoftGap))
            return SponsorProofReadinessClassification.NeedsBaseline;

        return SponsorProofReadinessClassification.Incomplete;

    }

    private static bool IsComparativeBaselineSoftGap(string message) =>
        message.Contains(ComparativeBaselineNarrativeSoftGapToken, StringComparison.OrdinalIgnoreCase);

    public static string DescribeForMarkdownTable(SponsorProofReadinessClassification classification) =>
        classification switch
        {
            SponsorProofReadinessClassification.Sendable =>
                "**Sendable** — structural proof fields and tenant ROI baseline are strong. Operators still owe qualitative baselines, attachments, and redaction.",
            SponsorProofReadinessClassification.NeedsBaseline =>
                "**NeedsBaseline** — only the comparative ROI baseline posture is weak (tenant defaults or no measurement). Capture a tenant baseline before customer-specific or dollar sponsor claims.",
            SponsorProofReadinessClassification.DemoOnly =>
                "**DemoOnly** — seeded or demo tenant. Use for internal walkthroughs only; do not quote as verified customer ROI.",
            SponsorProofReadinessClassification.Incomplete =>
                "**Incomplete** — missing attested proof fields or non-baseline caveats remain (see buyer-safe gate). Do not present as sponsor-complete.",
            _ => throw new ArgumentOutOfRangeException(nameof(classification), classification, null),
        };
}
