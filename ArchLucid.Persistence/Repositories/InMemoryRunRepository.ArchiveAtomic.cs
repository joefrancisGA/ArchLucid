using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryRunRepository
{
    private enum ArchiveTransition
    {
        Missing,
        Ineligible,
        AlreadyArchived,
        Archived
    }

    /// <summary>
    /// Archive a single current run row using the same row-lock and dictionary compare/exchange
    /// protocol as UpdateAsync. Once a writer publishes a replacement, an old reference is stale.
    /// The filter runs before the archived check so foreign-scope rows are never disclosed.
    /// </summary>
    private ArchiveTransition TryArchiveCurrentRun(
        Guid runId,
        DateTime archivedUtc,
        Func<RunRecord, bool> filter,
        Func<RunRecord, bool>? unsealedGuard,
        CancellationToken ct,
        out ArchivedRunScopeRow? archivedRow)
    {
        archivedRow = null;

        while (true)
        {
            ct.ThrowIfCancellationRequested();
            if (!_store.TryGetValue(runId, out RunRecord? current))
                return ArchiveTransition.Missing;

            lock (current)
            {
                // An update/commit/archive may have replaced the row while we waited.
                // Re-read the current value rather than mutating an orphaned object.
                if (!_store.TryGetValue(runId, out RunRecord? observed) ||
                    !ReferenceEquals(current, observed))
                    continue;

                if (!filter(current))
                    return ArchiveTransition.Ineligible;

                if (current.ArchivedUtc.HasValue)
                    return ArchiveTransition.AlreadyArchived;

                if (unsealedGuard is not null && !unsealedGuard(current))
                    return ArchiveTransition.Ineligible;

                RunRecord replacement = CopyRunRecord(current);
                replacement.ArchivedUtc = archivedUtc;
                replacement.RowVersion = NextFakeRowVersion();

                if (!_store.TryUpdate(runId, replacement, current))
                    continue;

                archivedRow = RunRepositoryCore.ToArchivedRunScopeRow(current);
                return ArchiveTransition.Archived;
            }
        }
    }
}
