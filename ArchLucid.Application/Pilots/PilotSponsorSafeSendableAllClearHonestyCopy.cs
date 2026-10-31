using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotSponsorSafeSendableAllClearHonestyCopy
{
    internal const string AllClearConcreteGapPlain =
        "No remaining automated sponsor-blocking checks — structured gate detail is spelled out later; still reconcile qualitative baselines.";

    internal static string FormatProofSendabilityMirrorCell(ProofPackageCompletenessResponse c)
    {
        ArgumentNullException.ThrowIfNull(c);

        string mirror = FormattableString.Invariant(
            $"{FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.ProofSendability ?? string.Empty)} · {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.PublishingTier ?? string.Empty)} · {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.EvidenceCompleteness ?? string.Empty)}");

        return string.Equals(c.ProofSendability, nameof(ProofPackageSendability.Sendable), StringComparison.Ordinal)
            ? FormattableString.Invariant($"{mirror}; {AllClearConcreteGapPlain}")
            : mirror;
    }

    internal static string FormatSponsorSafeConcreteGapLine() => AllClearConcreteGapPlain;

    internal const string NotSendableSendabilityNotePlain =
        "Treat every exported number as provisional until reconciled gaps are cleared.";

    internal static string FormatSendabilityNoteWhenSendable() =>
        FormattableString.Invariant($"**Sendability note:** {AllClearConcreteGapPlain}");

    internal static string FormatSendabilityNoteWhenNotSendable() =>
        FormattableString.Invariant($"**Sendability note:** {NotSendableSendabilityNotePlain}");

    internal static string FormatGateMirrorsStructuredMarkdownLine(
        ProofPackageCompletenessResponse proof,
        PilotBuyerSafeEvidenceGateResult? gate = null)
    {
        ArgumentNullException.ThrowIfNull(proof);

        string body = FormattableString.Invariant(
            $"ProofSendability = **{FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(proof.ProofSendability ?? string.Empty)}** · Publishing tier = **{FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(proof.PublishingTier ?? string.Empty)}** · Evidence completeness = **{FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(proof.EvidenceCompleteness ?? string.Empty)}**");

        bool sendablePosture = gate?.ProofSendability is ProofPackageSendability.Sendable
            || (gate is null
                && string.Equals(
                    proof.ProofSendability,
                    nameof(ProofPackageSendability.Sendable),
                    StringComparison.Ordinal));

        if (sendablePosture)
            body = FormattableString.Invariant($"{body}; {AllClearConcreteGapPlain}");

        return FormattableString.Invariant($"**Gate mirrors (structured):** {body}.");
    }
}
