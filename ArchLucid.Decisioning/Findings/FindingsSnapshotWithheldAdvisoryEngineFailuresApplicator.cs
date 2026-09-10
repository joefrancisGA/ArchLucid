using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Plugins;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Maps commit-allowed engine failures onto the DR-02 withheld band so Working cannot screenshot a clean
///     findings list when an advisory engine threw.
/// </summary>
public static class FindingsSnapshotWithheldAdvisoryEngineFailuresApplicator
{
    public static void Apply(FindingsSnapshot snapshot, bool compliancePackRequired = true)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        IReadOnlyList<FindingEngineFailure> engineFailures = snapshot.EngineFailures ?? [];

        if (engineFailures.Count == 0)
        {
            return;
        }

        snapshot.WithheldFindings ??= [];

        HashSet<string> existingIds = snapshot.WithheldFindings
            .Select(static row => row.WithheldFindingId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (FindingEngineFailure failure in FindingEngineFailureCommitClassifier.SelectAdvisoryFailures(
                     engineFailures,
                     compliancePackRequired))
        {
            WithheldFindingSummary withheld = WithheldFindingSummaryMapper.FromAdvisoryEngineFailure(failure);

            if (existingIds.Add(withheld.WithheldFindingId))
            {
                snapshot.WithheldFindings.Add(withheld);
            }
        }
    }

    public static int CountCatalogAdvisoryFailures(
        IReadOnlyList<FindingEngineFailure> engineFailures,
        bool compliancePackRequired = true)
    {
        ArgumentNullException.ThrowIfNull(engineFailures);

        return FindingEngineFailureCommitClassifier
            .SelectAdvisoryFailures(engineFailures, compliancePackRequired)
            .Count(failure => BuiltInFindingEngineTypeCatalog.EngineTypeIds.Contains(failure.EngineType));
    }
}
