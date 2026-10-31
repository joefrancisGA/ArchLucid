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
}
