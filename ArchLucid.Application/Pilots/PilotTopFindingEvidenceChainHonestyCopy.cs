namespace ArchLucid.Application.Pilots;

using System.Globalization;

using ArchLucid.Contracts.Explanation;

internal static class PilotTopFindingEvidenceChainHonestyCopy
{
    internal const string UnavailableProse =
        "Evidence chain unavailable — the top-severity finding is not present in the persisted FindingsSnapshot, or the chain service could not resolve it. Review the full run detail JSON for an alternate selection.";

    internal const string NoFindingsSkipPlain =
        "No findings on this run; evidence-chain excerpt skipped.";

    internal static string FormatPdfUnavailableItalicLine() =>
        FormattableString.Invariant($"({UnavailableProse})");

    internal static string FormatPdfNoFindingsSkipItalicLine() =>
        FormattableString.Invariant($"({NoFindingsSkipPlain})");

    internal static string FormatMarkdownProofPackageCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (deltas.TopFindingId is null)
        {
            return NoFindingsSkipPlain;
        }

        FindingEvidenceChainResponse? chain = deltas.TopFindingEvidenceChain;
        if (chain is null)
        {
            return UnavailableProse;
        }

        string decisionTraceLabel = chain.DecisionTraceId is { } traceId
            ? traceId.ToString("D", CultureInfo.InvariantCulture)
            : "Decision trace id was not stored.";

        return FormattableString.Invariant(
            $"Present — decision trace {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(decisionTraceLabel)}");
    }

    internal static string FormatSponsorSafeConcreteGapLineWhenUnavailable() => UnavailableProse;
}
