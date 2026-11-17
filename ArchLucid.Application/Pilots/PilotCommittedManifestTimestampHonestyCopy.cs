namespace ArchLucid.Application.Pilots;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

internal static class PilotCommittedManifestTimestampHonestyCopy
{
    internal const string MetadataCreatedUtcFieldLabel = "GoldenManifest.Metadata.CreatedUtc";

    internal const string UnresolvedSuffixPlain = "is default / not a real commit timestamp.";

    internal static string FormatProofPackageCell(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse c,
        GoldenManifest? manifest,
        ArchitectureRun run)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(c);
        ArgumentNullException.ThrowIfNull(run);

        if (!PilotSponsorCommittedPosture.HasCompleteCommittedPosture(run, manifest))
        {
            if (manifest is not null
                && run.Status != ArchitectureRunStatus.Committed
                && !c.CommittedManifestTimestampResolved)
            {
                return
                    $"Missing — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(MetadataCreatedUtcFieldLabel)} {UnresolvedSuffixPlain}";
            }

            return PilotCommittedManifestStatusHonestyCopy.NotSponsorCompletePlain;
        }

        if (manifest!.Metadata.CreatedUtc == default)
        {
            return
                $"Missing — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(MetadataCreatedUtcFieldLabel)} {UnresolvedSuffixPlain}";
        }

        DateTime committedUtc = deltas.ManifestCommittedUtc ?? manifest.Metadata.CreatedUtc;
        return
            $"Present — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(committedUtc.ToString("O", System.Globalization.CultureInfo.InvariantCulture))} ({FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(MetadataCreatedUtcFieldLabel)}).";
    }

    internal static string FormatSponsorSafeConcreteGapLine() =>
        FormattableString.Invariant($"Missing — {MetadataCreatedUtcFieldLabel} {UnresolvedSuffixPlain}");
}
