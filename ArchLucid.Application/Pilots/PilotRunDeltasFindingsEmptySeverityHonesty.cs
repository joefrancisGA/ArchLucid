namespace ArchLucid.Application.Pilots;

/// <summary>Shared empty-severity-bucket honesty for sponsor PDF/Markdown computed-deltas rows.</summary>
internal static class PilotRunDeltasFindingsEmptySeverityHonesty
{
    internal const string FindingsBySeverityNotAttestedLabel = "Findings by severity was not attested.";

    internal const string SnapshotZeroUnmutedFindingsPlainLabel =
        "0 unmuted findings in snapshot (no severity rows materialized).";

    internal const string AgentResultsIncludedEmptySeverityPlainLabel =
        "No findings were stored on agent results for this run.";

    internal const string FindingsTotalSourceAgentResultsOmittedLabel =
        "`ArchitectureRunDetail` agent results omitted on run detail payload";

    internal static string ResolveFindingsTotalSourceList(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (HasMaterialFindingWithoutSeverityBuckets(deltas))
        {
            return FindingsBySeverityNotAttestedLabel;
        }

        if (IsMutedOnlyEmptySeverity(deltas))
        {
            return PilotRunDeltasFindingsTotalFormatter.MutedOnlyFindingsTotalLabel;
        }

        if (IsSnapshotAttestedZeroUnmuted(deltas))
        {
            return PilotRunDeltasFindingsTotalFormatter.SnapshotZeroUnmutedFindingsTotalLabel;
        }

        if (deltas.FindingsCountsFromSnapshot)
        {
            return "`FindingsSnapshot.Findings` (unmuted only)";
        }

        if (!deltas.AgentResultsIncludedInDetail)
        {
            return FindingsTotalSourceAgentResultsOmittedLabel;
        }

        if (IsAgentResultsIncludedEmptySeverity(deltas))
        {
            return AgentResultsIncludedEmptySeverityPlainLabel;
        }

        return "`ArchitectureRunDetail.Results[*].Findings` (unmuted only)";
    }

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

    internal static bool IsMutedOnlyEmptySeverity(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        int unmutedTotal = deltas.FindingsBySeverity.Sum(static p => p.Value);

        return deltas.FindingsBySeverity.Count == 0
            && unmutedTotal == 0
            && deltas.MutedFindingsExcludedCount > 0
            && !HasMaterialFindingWithoutSeverityBuckets(deltas);
    }

    internal static bool IsAgentResultsOmittedEmptySeverity(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (deltas.AgentResultsIncludedInDetail)
        {
            return false;
        }

        int unmutedTotal = deltas.FindingsBySeverity.Sum(static p => p.Value);

        return deltas.FindingsBySeverity.Count == 0
            && unmutedTotal == 0
            && !HasMaterialFindingWithoutSeverityBuckets(deltas)
            && !IsMutedOnlyEmptySeverity(deltas)
            && !IsSnapshotAttestedZeroUnmuted(deltas);
    }

    internal static bool IsAgentResultsIncludedEmptySeverity(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.AgentResultsIncludedInDetail)
        {
            return false;
        }

        int unmutedTotal = deltas.FindingsBySeverity.Sum(static p => p.Value);

        return deltas.FindingsBySeverity.Count == 0
            && unmutedTotal == 0
            && !HasMaterialFindingWithoutSeverityBuckets(deltas)
            && !IsMutedOnlyEmptySeverity(deltas)
            && !IsSnapshotAttestedZeroUnmuted(deltas);
    }
}
