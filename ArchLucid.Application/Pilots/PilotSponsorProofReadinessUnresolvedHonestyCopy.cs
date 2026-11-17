using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotSponsorProofReadinessUnresolvedHonestyCopy
{
    internal const string UnresolvedPlain =
        "**Incomplete** — classification was not resolved server-side; treat this export as not sponsor-complete.";

    internal static string FormatProofPackageCell(string? sponsorProofReadiness)
    {
        return Enum.TryParse(sponsorProofReadiness, ignoreCase: false, out SponsorProofReadinessClassification readiness)
            ? SponsorProofReadinessClassifier.DescribeForMarkdownTable(readiness)
            : UnresolvedPlain;
    }

    internal static string FormatSponsorSafeStatusSectionLine() => UnresolvedPlain;
}
