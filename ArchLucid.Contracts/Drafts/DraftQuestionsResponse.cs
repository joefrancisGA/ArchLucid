namespace ArchLucid.Contracts.Drafts;

/// <summary>Current question set for a draft (<c>GET /v1/architecture/draft/{draftId}/questions</c>).</summary>
public sealed class DraftQuestionsResponse
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

    public QuestionSelectionResult Selection
    {
        get;
        set;
    } = new();
}
