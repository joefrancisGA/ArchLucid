using System.Globalization;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared time-to-commit copy for markdown computed-deltas tables and sponsor PDF delta rows.</summary>
internal static class PilotRunDeltasTimeToCommitFormatter
{
    internal const string NoCommittedManifestWallClockPlain =
        "Run has no committed manifest — elapsed time not computed.";

    internal static string FormatPlainText(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (deltas.TimeToCommittedManifest is not { } wall)
        {
            return NoCommittedManifestWallClockPlain;
        }

        string committedLabel = deltas.ManifestCommittedUtc?.ToString("O", CultureInfo.InvariantCulture)
            ?? "Committed time was not stored.";

        return FormattableString.Invariant(
            $"{wall:c} (committed {PilotPlainTextSafeLabelFormatter.FormatLabel(committedLabel)})");
    }

    internal static string FormatMarkdownTableCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (deltas.TimeToCommittedManifest is not { } wall)
        {
            return NoCommittedManifestWallClockPlain;
        }

        string committedLabel = deltas.ManifestCommittedUtc?.ToString("O", CultureInfo.InvariantCulture)
            ?? "Committed time was not stored.";

        return FormattableString.Invariant(
            $"**{wall:c}** (committed {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(committedLabel)})");
    }

    internal static string FormatSponsorSafeConcreteGapLineWhenUnresolved() => NoCommittedManifestWallClockPlain;
}
