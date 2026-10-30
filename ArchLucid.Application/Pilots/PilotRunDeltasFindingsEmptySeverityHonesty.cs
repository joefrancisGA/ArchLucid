namespace ArchLucid.Application.Pilots;

/// <summary>Shared empty-severity-bucket honesty for sponsor PDF/Markdown computed-deltas rows.</summary>
internal static class PilotRunDeltasFindingsEmptySeverityHonesty
{
    internal const string FindingsBySeverityNotAttestedLabel = "Findings by severity was not attested.";

    internal static bool HasMaterialFindingWithoutSeverityBuckets(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        return !string.IsNullOrWhiteSpace(deltas.TopFindingId) || deltas.SponsorNarrativeFindings.Count > 0;
    }

    internal static bool IsSnapshotAttestedZeroUnmuted(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        int unmutedTotal = deltas.FindingsBySeverity.Sum(static p => p.Value);

        return deltas.FindingsBySeverity.Count == 0
            && unmutedTotal == 0
            && deltas.MutedFindingsExcludedCount == 0
            && deltas.FindingsCountsFromSnapshot
            && !HasMaterialFindingWithoutSeverityBuckets(deltas);
    }
}
