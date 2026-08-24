using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Merges additional findings into an authority snapshot using ADR 0063 confluent join.
/// </summary>
public static class FindingsSnapshotAuthorityMerger
{
    public static void MergeAdditionalFindings(
        FindingsSnapshot snapshot,
        IReadOnlyList<Finding> additionalFindings,
        TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(additionalFindings);
        ArgumentNullException.ThrowIfNull(clock);

        if (additionalFindings.Count == 0)
            return;

        List<Finding> combined = [.. snapshot.Findings, .. additionalFindings];
        FindingSnapshotMergeResult mergeResult = FindingSnapshotConfluentMerger.Merge(combined, clock);

        snapshot.Findings = mergeResult.Findings.ToList();
        snapshot.EngineFailures.AddRange(mergeResult.Conflicts);
    }
}
