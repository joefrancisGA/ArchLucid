using System.Globalization;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared time-to-commit copy for markdown computed-deltas tables and sponsor PDF delta rows.</summary>
internal static class PilotRunDeltasTimeToCommitFormatter
{
    internal const string NoCommittedManifestWallClockPlain =
        "Run has no committed manifest — elapsed time not computed.";

    internal static string FormatPlainText(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse? proofCompleteness = null,
        ArchitectureRun? run = null,
        GoldenManifest? manifest = null)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (ShouldDeferWallClockCopy(proofCompleteness, run, manifest))
            return PilotCommittedManifestStatusHonestyCopy.NotSponsorCompletePlain;

        return FormatPlainTextCore(deltas);
    }

    internal static string FormatMarkdownTableCell(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse? proofCompleteness = null,
        ArchitectureRun? run = null,
        GoldenManifest? manifest = null)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (ShouldDeferWallClockCopy(proofCompleteness, run, manifest))
            return PilotCommittedManifestStatusHonestyCopy.NotSponsorCompletePlain;

        return FormatMarkdownTableCellCore(deltas);
    }

    internal static string FormatSponsorSafeConcreteGapLineWhenUnresolved() => NoCommittedManifestWallClockPlain;

    internal static bool ShouldDeferWallClockCopy(
        ProofPackageCompletenessResponse? proofCompleteness,
        ArchitectureRun? run,
        GoldenManifest? manifest)
    {
        if (run is not null)
            return !PilotSponsorCommittedPosture.HasCompleteCommittedPosture(run, manifest);

        return proofCompleteness is not null
            && proofCompleteness is not { CommittedManifestPresent: true, RunInCommittedStatus: true };
    }

    private static string FormatPlainTextCore(PilotRunDeltas deltas)
    {
        if (deltas.TimeToCommittedManifest is not { } wall)
            return NoCommittedManifestWallClockPlain;

        string committedLabel = deltas.ManifestCommittedUtc?.ToString("O", CultureInfo.InvariantCulture)
            ?? "Committed time was not stored.";

        return FormattableString.Invariant(
            $"{wall:c} (committed {PilotPlainTextSafeLabelFormatter.FormatLabel(committedLabel)})");
    }

    private static string FormatMarkdownTableCellCore(PilotRunDeltas deltas)
    {
        if (deltas.TimeToCommittedManifest is not { } wall)
            return NoCommittedManifestWallClockPlain;

        string committedLabel = deltas.ManifestCommittedUtc?.ToString("O", CultureInfo.InvariantCulture)
            ?? "Committed time was not stored.";

        return FormattableString.Invariant(
            $"**{wall:c}** (committed {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(committedLabel)})");
    }
}
