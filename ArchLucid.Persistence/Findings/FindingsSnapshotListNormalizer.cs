using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Legacy <c>FindingsJson</c> documents predate some collection properties, so deserialization can yield nulls where
///     callers expect empty lists.
/// </summary>
internal static class FindingsSnapshotListNormalizer
{
    public static void CoerceNullLists(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        snapshot.EngineFailures ??= [];
        snapshot.Findings ??= [];
        snapshot.ChecklistCoverage ??= [];
    }
}
