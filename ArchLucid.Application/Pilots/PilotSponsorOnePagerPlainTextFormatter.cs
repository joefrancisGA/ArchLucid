namespace ArchLucid.Application.Pilots;

/// <summary>Plain-text copy helpers for sponsor one-pager PDF body lines.</summary>
internal static class PilotSponsorOnePagerPlainTextFormatter
{
    internal static string FormatRunHeaderLine(string runId) =>
        FormattableString.Invariant($"Run: {PilotPlainTextSafeLabelFormatter.FormatLabel(runId.Trim())}");

    internal static string FormatManifestVersionLine(string? manifestVersion) =>
        FormatLabeledField("Manifest version", manifestVersion, "Manifest version was not stored.");

    internal static string FormatCommittedManifestVersionLine(string? manifestVersion) =>
        FormatLabeledField("Committed manifest version", manifestVersion, "Manifest version was not stored.");

    internal static string FormatSystemNameLine(string? systemName) =>
        FormatLabeledField("System", systemName, "System name was not stored.");

    private static string FormatLabeledField(string label, string? value, string missingCopy)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return FormattableString.Invariant($"{label}: {missingCopy}");
        }

        return FormattableString.Invariant(
            $"{label}: {PilotPlainTextSafeLabelFormatter.FormatLabel(value.Trim())}");
    }
}
