using System.Globalization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotArtifactDescriptorCountHonestyCopy
{
    internal const string UnresolvedPlain =
        "Missing — committed architecture manifest id absent or synthesized artifact query failed (see audit/logs rather than guessing).";

    internal static string FormatProofPackageCell(ProofPackageCompletenessResponse c)
    {
        ArgumentNullException.ThrowIfNull(c);

        if (c is not { CommittedManifestPresent: true, RunInCommittedStatus: true })
        {
            return PilotCommittedManifestStatusHonestyCopy.NotSponsorCompletePlain;
        }

        if (!c.ArtifactDescriptorCountResolved)
        {
            return UnresolvedPlain;
        }

        return
            $"Present — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.ArtifactDescriptorCount.GetValueOrDefault().ToString(CultureInfo.InvariantCulture))} descriptor(s) for this committed architecture manifest.";
    }

    internal static string FormatProofPackageCell(PilotRunDeltas deltas, ArchitectureRun run, GoldenManifest? manifest)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(run);

        if (manifest is null || run.Status != ArchitectureRunStatus.Committed)
        {
            return PilotCommittedManifestStatusHonestyCopy.NotSponsorCompletePlain;
        }

        if (!deltas.SynthesizedArtifactDescriptorCountResolved)
        {
            return UnresolvedPlain;
        }

        int count = deltas.SynthesizedArtifactDescriptorCount.GetValueOrDefault();
        return
            $"Present — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(count.ToString(CultureInfo.InvariantCulture))} descriptor(s) for this committed architecture manifest.";
    }

    internal static string FormatSponsorSafeConcreteGapLine() => UnresolvedPlain;
}
