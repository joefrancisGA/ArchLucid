using ArchLucid.Application.Diffs;
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

        CompareInputFingerprintsNormalizer.NormalizeInPlace(diff.InputFingerprints);
    }

    private static void NormalizeDeltaInPlace(AgentResultDelta delta)
    {
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
}
