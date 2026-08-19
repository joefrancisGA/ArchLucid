using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Confluent in-snapshot join keyed by ADR 0063 identity.
///     Payload-equal partitions keep the lowest <c>EngineType</c> (ordinal);
///     payload-unequal partitions keep that primary and emit a conflict failure.
/// </summary>
internal static class FindingSnapshotConfluentMerger
{
    internal const string ConflictEngineType = "finding-merge-conflict";

    internal const string ConflictExceptionType = "FindingMergeConflict";

    public static FindingSnapshotMergeResult Merge(IReadOnlyList<Finding> findings, TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(clock);

        if (findings.Count == 0)
            return new FindingSnapshotMergeResult([], []);

        List<Finding> kept = [];
        List<FindingEngineFailure> conflicts = [];

        IEnumerable<IGrouping<string, Finding>> partitions = findings.GroupBy(
            FindingSnapshotMergeKey.FromFinding,
            StringComparer.Ordinal);

        foreach (IGrouping<string, Finding> partition in partitions)
        {
            List<Finding> members = [.. partition.Where(static f => f is not null)];

            if (members.Count == 0)
                continue;

            Finding primary = SelectPrimary(members);

            if (members.Count == 1 || AreAllPayloadEqual(members))
            {
                kept.Add(primary);
                continue;
            }

            kept.Add(primary);
            conflicts.Add(CreateConflictFailure(members, clock));
        }

        return new FindingSnapshotMergeResult(kept, conflicts);
    }

    private static Finding SelectPrimary(IReadOnlyList<Finding> members)
    {
        return members
            .OrderBy(static f => f.EngineType ?? string.Empty, StringComparer.Ordinal)
            .ThenBy(static f => f.FindingId ?? string.Empty, StringComparer.Ordinal)
            .First();
    }

    private static bool AreAllPayloadEqual(IReadOnlyList<Finding> members)
    {
        Finding first = members[0];

        return members.All(f => FindingPayloadOrdinalEqualityComparer.Instance.Equals(f, first));
    }

    private static FindingEngineFailure CreateConflictFailure(IReadOnlyList<Finding> members, TimeProvider clock)
    {
        Finding primary = SelectPrimary(members);

        string engineTypes = string.Join(
            ", ",
            members
                .Select(static f => f.EngineType ?? string.Empty)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(static id => id, StringComparer.Ordinal));

        string findingIds = string.Join(
            ", ",
            members
                .Select(static f => f.FindingId ?? string.Empty)
                .OrderBy(static id => id, StringComparer.Ordinal));

        return new FindingEngineFailure
        {
            EngineType = ConflictEngineType,
            Category = primary.Category ?? string.Empty,
            ErrorMessage =
                $"Finding merge conflict on ADR 0063 key. EngineTypes=[{engineTypes}]; FindingIds=[{findingIds}]",
            ExceptionType = ConflictExceptionType,
            DurationMs = 0,
            OccurredUtc = clock.UtcNowDateTime(),
        };
    }
}
