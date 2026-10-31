namespace ArchLucid.Application.Pilots;

using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Pilots;

internal static class PilotCommittedManifestTimestampHonestyCopy
{
    internal const string MetadataCreatedUtcFieldLabel = "GoldenManifest.Metadata.CreatedUtc";

    internal const string UnresolvedSuffixPlain = "is default / not a real commit timestamp.";

    internal static string FormatProofPackageCell(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse c,
        GoldenManifest? manifest)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(c);

        if (!c.CommittedManifestPresent)
        {
            return "Missing — no committed architecture manifest on this run detail.";
        }

        if (!c.CommittedManifestTimestampResolved)
        {
            return
                $"Missing — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(MetadataCreatedUtcFieldLabel)} {UnresolvedSuffixPlain}";
        }

        DateTime committedUtc = deltas.ManifestCommittedUtc ?? manifest!.Metadata.CreatedUtc;
        return
            $"Present — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(committedUtc.ToString("O", System.Globalization.CultureInfo.InvariantCulture))} ({FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(MetadataCreatedUtcFieldLabel)}).";
    }

    internal static string FormatSponsorSafeConcreteGapLine() =>
        FormattableString.Invariant($"Missing — {MetadataCreatedUtcFieldLabel} {UnresolvedSuffixPlain}");
}
