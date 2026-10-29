using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes agent-result diff sections on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class AgentResultDiffNormalizer
{
    internal static void NormalizeInPlace(AgentResultDiffResult? diff)
    {
        if (diff is null)
            return;

        diff.LeftRunId = NormalizeRunIdAnchor(diff.LeftRunId);
        diff.RightRunId = NormalizeRunIdAnchor(diff.RightRunId);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.Warnings);

        for (int i = diff.AgentDeltas.Count - 1; i >= 0; i--)
        {
            AgentResultDelta delta = diff.AgentDeltas[i];
            NormalizeDeltaInPlace(delta);

            if (!AgentResultDeltaMateriality.HasMaterialChanges(delta))
                diff.AgentDeltas.RemoveAt(i);
        }

        DedupeAgentDeltasByAgentTypeKeepFirstInPlace(diff.AgentDeltas);

        CompareInputFingerprintsNormalizer.NormalizeInPlace(diff.InputFingerprints);
    }

    private static void DedupeAgentDeltasByAgentTypeKeepFirstInPlace(List<AgentResultDelta> agentDeltas)
    {
        if (agentDeltas.Count < 2)
            return;

        HashSet<AgentType> seen = [];
        List<AgentResultDelta> distinct = [];

        foreach (AgentResultDelta delta in agentDeltas)
        {
            if (!seen.Add(delta.AgentType))
                continue;

            distinct.Add(delta);
        }

        if (distinct.Count == agentDeltas.Count)
            return;

        agentDeltas.Clear();
        agentDeltas.AddRange(distinct);
    }

    internal static bool IsPersistedEmptyShell(AgentResultDiffResult diff) =>
        diff.AgentDeltas.Count == 0
        && diff.Warnings.Count == 0
        && diff.LeftRunId.Length == 0
        && diff.RightRunId.Length == 0
        && (diff.InputFingerprints is null
            || CompareInputFingerprintsNormalizer.IsPersistedEmptyShell(diff.InputFingerprints));

    private static void NormalizeDeltaInPlace(AgentResultDelta delta)
    {
        delta.LeftConfidence = NormalizeOptionalConfidence(delta.LeftConfidence);
        delta.RightConfidence = NormalizeOptionalConfidence(delta.RightConfidence);

        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.AddedClaims);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.RemovedClaims);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.AddedEvidenceRefs);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.RemovedEvidenceRefs);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.AddedFindings);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.RemovedFindings);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.AddedRequiredControls);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.RemovedRequiredControls);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.AddedWarnings);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(delta.RemovedWarnings);
    }

    private static string NormalizeRunIdAnchor(string runId) =>
        string.IsNullOrWhiteSpace(runId) ? string.Empty : AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);

    internal static double? NormalizeOptionalConfidence(double? confidence)
    {
        if (!confidence.HasValue)
            return null;

        double value = confidence.Value;
        if (double.IsNaN(value) || double.IsInfinity(value) || value < 0d || value > 1d)
            return null;

        return value;
    }
}
