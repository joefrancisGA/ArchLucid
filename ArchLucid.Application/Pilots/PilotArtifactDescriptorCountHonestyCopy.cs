using System.Globalization;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotArtifactDescriptorCountHonestyCopy
{
    internal const string UnresolvedPlain =
        "Missing — committed architecture manifest id absent or synthesized artifact query failed (see audit/logs rather than guessing).";

    internal static string FormatProofPackageCell(ProofPackageCompletenessResponse c)
    {
        ArgumentNullException.ThrowIfNull(c);

        if (!c.ArtifactDescriptorCountResolved)
        {
            return UnresolvedPlain;
        }

        return
            $"Present — {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.ArtifactDescriptorCount.GetValueOrDefault().ToString(CultureInfo.InvariantCulture))} descriptor(s) for this committed architecture manifest.";
    }

    internal static string FormatSponsorSafeConcreteGapLine() => UnresolvedPlain;
}
