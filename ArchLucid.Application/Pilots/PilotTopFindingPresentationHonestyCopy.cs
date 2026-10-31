namespace ArchLucid.Application.Pilots;

internal static class PilotTopFindingPresentationHonestyCopy
{
    internal const string SeverityNotStored = "Severity was not stored.";

    internal static string ResolveTopFindingSeverity(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        return string.IsNullOrWhiteSpace(deltas.TopFindingSeverity)
            ? SeverityNotStored
            : deltas.TopFindingSeverity.Trim();
    }

    internal static string FormatSelectedFindingMarkdownLine(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        string title = string.IsNullOrWhiteSpace(deltas.TopFindingTitle)
            ? PilotSponsorMaterialFindingsHonestyCopy.FindingTitleNotStored
            : deltas.TopFindingTitle.Trim();

        string severity = ResolveTopFindingSeverity(deltas);

        return FormattableString.Invariant(
            $"Selected finding: {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(title)} (severity {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(severity)}).");
    }

    internal static string FormatSelectedFindingPlainLine(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        string title = string.IsNullOrWhiteSpace(deltas.TopFindingTitle)
            ? PilotSponsorMaterialFindingsHonestyCopy.FindingTitleNotStored
            : deltas.TopFindingTitle.Trim();

        string severity = ResolveTopFindingSeverity(deltas);

        return FormattableString.Invariant(
            $"Selected finding: {PilotPlainTextSafeLabelFormatter.FormatLabel(title)} (severity {PilotPlainTextSafeLabelFormatter.FormatLabel(severity)}).");
    }
}
