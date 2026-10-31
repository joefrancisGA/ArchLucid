using System.Globalization;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared findings-total honesty for first-value markdown and sponsor one-pager PDF.</summary>
internal static class PilotRunDeltasFindingsTotalFormatter
{
    internal const string FindingsTotalNotAttestedLabel = "Findings total was not attested.";

    internal const string MutedOnlyFindingsTotalLabel =
        "0 (muted findings were excluded from this total.)";

    internal static string FormatFindingsTotal(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        int unmutedTotal = deltas.FindingsBySeverity.Sum(static p => p.Value);

        if (unmutedTotal == 0 && deltas.MutedFindingsExcludedCount > 0)
        {
            return MutedOnlyFindingsTotalLabel;
        }

        if (deltas.FindingsBySeverity.Count == 0
            && deltas.SponsorNarrativeFindings.Count == 0
            && string.IsNullOrWhiteSpace(deltas.TopFindingId))
        {
            return FindingsTotalNotAttestedLabel;
        }

        return unmutedTotal.ToString(CultureInfo.InvariantCulture);
    }
}
