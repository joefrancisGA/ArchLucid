namespace ArchLucid.Persistence.Models;

/// <summary>
///     Result of one <c>dbo.Archival_PurgeStaleUncommittedRunsBatch</c> invocation (non-committed runs only).
/// </summary>
public sealed class RunStaleUncommittedPurgeBatchResult
{
    public IReadOnlyList<ArchivedRunScopeRow> Deleted
    {
        get;
        init;
    } = [];

    public int DeletedCount => Deleted.Count;
}
