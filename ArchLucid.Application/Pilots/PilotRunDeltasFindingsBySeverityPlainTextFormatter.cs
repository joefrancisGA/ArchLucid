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
                    $"{PilotPlainTextSafeLabelFormatter.FormatLabel(p.Key)}: {p.Value.ToString(CultureInfo.InvariantCulture)}"));
        }

        if (PilotRunDeltasFindingsEmptySeverityHonesty.HasMaterialFindingWithoutSeverityBuckets(deltas))
        {
            return PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel;
        }

        if (PilotRunDeltasFindingsEmptySeverityHonesty.IsMutedOnlyEmptySeverity(deltas))
        {
            return PilotRunDeltasFindingsTotalFormatter.MutedOnlyFindingsTotalLabel;
        }

        if (PilotRunDeltasFindingsEmptySeverityHonesty.IsSnapshotAttestedZeroUnmuted(deltas))
        {
            return PilotRunDeltasFindingsEmptySeverityHonesty.SnapshotZeroUnmutedFindingsPlainLabel;
        }

        if (!deltas.AgentResultsIncludedInDetail)
        {
            return PilotSponsorMaterialFindingsHonestyCopy.AgentFindingsNotStored;
        }

        return "No findings were stored on agent results for this run.";
    }

}
