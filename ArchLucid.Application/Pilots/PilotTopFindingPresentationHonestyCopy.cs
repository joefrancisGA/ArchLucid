namespace ArchLucid.Application.Pilots;

internal static class PilotTopFindingPresentationHonestyCopy
{
    internal const string SeverityNotStored = "Severity was not stored.";

    internal static string FormatSelectedFindingMarkdownLine(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        string title = string.IsNullOrWhiteSpace(deltas.TopFindingTitle)
            ? PilotSponsorMaterialFindingsHonestyCopy.FindingTitleNotStored
            : deltas.TopFindingTitle.Trim();

        string severity = deltas.TopFindingSeverity ?? SeverityNotStored;

        return FormattableString.Invariant(
            $"Selected finding: {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(title)} (severity {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(severity)}).");
    }

    internal static string FormatSelectedFindingPlainLine(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        string title = string.IsNullOrWhiteSpace(deltas.TopFindingTitle)
            ? PilotSponsorMaterialFindingsHonestyCopy.FindingTitleNotStored
            : deltas.TopFindingTitle.Trim();

        string severity = deltas.TopFindingSeverity ?? SeverityNotStored;

        return FormattableString.Invariant($"Selected finding: {title} (severity {severity}).");
    }
}
