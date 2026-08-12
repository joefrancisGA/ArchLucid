using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Turns the archive-by-ids batch result sets into a per-id outcome.
/// </summary>
/// <remarks>
///     The batch reports what it archived and what was already archived, but says nothing about ids it never saw. Every
///     requested id therefore has to be accounted for here so callers can tell "already archived" (benign, likely a
///     retry) from "not found" (the caller's id was wrong or the run was purged).
/// </remarks>
internal static class RunArchiveByIdsOutcome
{
    private const string AlreadyArchivedReason = "Run already archived.";
    private const string NotFoundReason = "Run not found.";

    /// <summary>
    ///     Preserves the caller's id order while dropping duplicates, so a repeated id is archived and reported once.
    /// </summary>
    public static List<Guid> DistinctInRequestOrder(IReadOnlyList<Guid> runIds)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        HashSet<Guid> seen = [];

        return runIds.Where(seen.Add).ToList();
    }

    public static RunArchiveByIdsResult Assemble(
        IReadOnlyList<Guid> requestedInOrder,
        IReadOnlyList<ArchivedRunScopeRow> archived,
        IReadOnlyList<Guid> alreadyArchivedRunIds,
        RunArchiveChildCascadeCounts childCascade)
    {
        ArgumentNullException.ThrowIfNull(requestedInOrder);
        ArgumentNullException.ThrowIfNull(archived);
        ArgumentNullException.ThrowIfNull(alreadyArchivedRunIds);

        HashSet<Guid> newlyArchived = archived.Select(static row => row.RunId).ToHashSet();
        HashSet<Guid> alreadyArchived = alreadyArchivedRunIds.ToHashSet();

        List<RunArchiveByIdFailure> failed = requestedInOrder
            .Where(runId => !newlyArchived.Contains(runId))
            .Select(runId => new RunArchiveByIdFailure(
                runId,
                alreadyArchived.Contains(runId) ? AlreadyArchivedReason : NotFoundReason))
            .ToList();

        return new RunArchiveByIdsResult
        {
            SucceededRunIds = archived.Select(static row => row.RunId).ToList(),
            ArchivedRuns = archived,
            Failed = failed,
            ChildCascade = childCascade
        };
    }
}
