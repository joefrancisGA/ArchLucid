namespace ArchLucid.Application.Pilots;

/// <summary>Plain-text copy helpers for sponsor one-pager PDF body lines.</summary>
internal static class PilotSponsorOnePagerPlainTextFormatter
{
    internal static string FormatRunHeaderLine(string runId) =>
        FormattableString.Invariant($"Run: {PilotPlainTextSafeLabelFormatter.FormatLabel(runId.Trim())}");

    internal static string FormatManifestVersionLine(string? manifestVersion)
    {
        if (string.IsNullOrWhiteSpace(manifestVersion))
        {
            return "Manifest version: Manifest version was not stored.";
        }

        return FormattableString.Invariant(
            $"Manifest version: {PilotPlainTextSafeLabelFormatter.FormatLabel(manifestVersion.Trim())}");
    }
}
