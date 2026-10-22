namespace ArchLucid.Contracts.Drafts;

/// <summary>Outcome of <c>POST /v1/architecture/draft/{draftId}/submit</c>.</summary>
public sealed class SubmitDraftResponse
{
    public Guid DraftId
    {
        get;
        set;
    }

    public DraftRequestStatus Status
    {
        get;
        set;
    }

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string RequestId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Parent run id when this draft is a what-if branch and the parent draft already spawned a run (R12).
    /// </summary>
    public string? ParentSpawnedRunId
    {
        get;
        set;
    }
}
