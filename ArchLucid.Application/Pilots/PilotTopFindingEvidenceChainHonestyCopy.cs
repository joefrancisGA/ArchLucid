namespace ArchLucid.Application.Pilots;

internal static class PilotTopFindingEvidenceChainHonestyCopy
{
    internal const string UnavailableProse =
        "Evidence chain unavailable — the top-severity finding is not present in the persisted FindingsSnapshot, or the chain service could not resolve it. Review the full run detail JSON for an alternate selection.";

    internal static string FormatPdfUnavailableItalicLine() =>
        FormattableString.Invariant($"({UnavailableProse})");
}
