namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Thrown when a run update cannot apply because its expected version or lifecycle state is no longer current.
/// </summary>
public sealed class RunConcurrencyConflictException : InvalidOperationException
{
    /// <summary>Creates an exception for the given run id.</summary>
    public RunConcurrencyConflictException(Guid runId)
        : base($"Run '{runId:D}' was modified by another writer; reload and retry.")
    {
        RunId = runId;
    }

    /// <summary>Run that failed the optimistic concurrency check.</summary>
    public Guid RunId
    {
        get;
    }
}
