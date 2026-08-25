using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Promotes <see cref="FindingSnapshotConfluentMerger.ConflictEngineType" /> engine failures to
///     first-class finding rows for operator triage and resolution.
/// </summary>
internal static class FindingMergeConflictPresenter
{
    internal const string FindingType = "FindingMergeConflict";
    internal const string PolicyRuleId = "finding-merge-conflict";

    public static IReadOnlyList<Finding> PresentAsFindings(
        IReadOnlyList<FindingEngineFailure> conflicts,
        TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(conflicts);
        ArgumentNullException.ThrowIfNull(clock);

        List<Finding> rows = [];

        foreach (FindingEngineFailure conflict in conflicts)
        {
            if (!string.Equals(
                    conflict.EngineType,
                    FindingSnapshotConfluentMerger.ConflictEngineType,
                    StringComparison.Ordinal))
            {
                continue;
            }

            rows.Add(MapConflict(conflict, clock));
        }

        return rows;
    }

    private static Finding MapConflict(FindingEngineFailure conflict, TimeProvider clock)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["findingMerge.conflict"] = bool.TrueString,
            ["findingMerge.exceptionType"] = conflict.ExceptionType ?? string.Empty,
            ["findingMerge.engineType"] = conflict.EngineType ?? string.Empty,
            ["findingMerge.occurredUtc"] = conflict.OccurredUtc.ToString("O"),
        };

        return new Finding
        {
            FindingId = Guid.NewGuid().ToString("N"),
            FindingType = FindingType,
            Category = conflict.Category ?? string.Empty,
            PolicyRuleId = PolicyRuleId,
            EngineType = FindingSnapshotConfluentMerger.ConflictEngineType,
            Severity = FindingSeverity.Warning,
            Title = "Finding merge conflict requires operator resolution",
            Rationale = conflict.ErrorMessage ?? "Conflicting findings share an ADR 0063 key with different payloads.",
            ConfidenceScore = 1.0,
            HumanReviewStatus = FindingHumanReviewStatus.Pending,
            Properties = properties,
        };
    }
}
