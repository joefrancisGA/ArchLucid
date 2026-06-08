namespace ArchLucid.Contracts.Drafts;

/// <summary>Outcome of <c>POST /v1/architecture/draft/{draftId}/branch</c> (R12).</summary>
public sealed class BranchDraftResponse
{
    public Guid ParentDraftId
    {
        get;
        set;
    }

    /// <summary>Parent run id for Compare once the branch is submitted (may be null if parent not yet spawned).</summary>
    public string? ParentSpawnedRunId
    {
        get;
        set;
    }

    public DraftRequestResponse Branch
    {
        get;
        set;
    } = new();
}
