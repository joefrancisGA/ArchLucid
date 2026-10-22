namespace ArchLucid.Persistence.Models;

/// <summary>Result of one <c>dbo.SampleRunPurgeBatch</c> invocation.</summary>
public sealed class RunSamplePurgeBatchResult
{
    public IReadOnlyList<ArchivedRunScopeRow> Deleted
    {
        get;
        init;
    } = [];
}
