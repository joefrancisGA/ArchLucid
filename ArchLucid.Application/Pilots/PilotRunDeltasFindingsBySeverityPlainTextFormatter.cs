using System.Globalization;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared findings-by-severity honesty for sponsor one-pager PDF delta rows.</summary>
internal static class PilotRunDeltasFindingsBySeverityPlainTextFormatter
{
    internal static string Format(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (deltas.FindingsBySeverity.Count > 0)
        {
            return string.Join(
                ", ",
                deltas.FindingsBySeverity.Select(static p =>
                    $"{FormatSeverityLabel(p.Key)}: {p.Value.ToString(CultureInfo.InvariantCulture)}"));
        }

        if (deltas.FindingsCountsFromSnapshot)
        {
            return "0 unmuted findings in snapshot (no severity rows materialized).";
        }

        if (!deltas.AgentResultsIncludedInDetail)
        {
            return PilotSponsorMaterialFindingsHonestyCopy.AgentFindingsNotStored;
        }

        return "No findings were stored on agent results for this run.";
    }

    private static string FormatSeverityLabel(string key)
    {
        if (string.IsNullOrEmpty(key))
            return "''";

        if (key.Contains('|', StringComparison.Ordinal)
            || key.Contains(',', StringComparison.Ordinal)
            || key.Contains(':', StringComparison.Ordinal))
        {
            return $"'{key.Replace("'", "''", StringComparison.Ordinal)}'";
        }

        return key;
    }
}
