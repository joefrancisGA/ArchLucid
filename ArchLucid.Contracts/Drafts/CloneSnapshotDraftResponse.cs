namespace ArchLucid.Contracts.Drafts;

/// <summary>Outcome of <c>POST /v1/architecture/draft/{draftId}/clone-snapshot</c> (WA-10).</summary>
public sealed class CloneSnapshotDraftResponse
{
    public Guid SourceDraftId
    {
        get;
        set;
    }

    /// <summary>Spawned run id on the locked source draft (unchanged).</summary>
    public string? SourceSpawnedRunId
    {
        get;
        set;
    }

    public DraftRequestResponse Clone
    {
        get;
        set;
    } = new();
}
