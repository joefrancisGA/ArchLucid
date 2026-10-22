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

    private QuestionSelectionResult selection = new();

    public QuestionSelectionResult Selection
    {
        get => selection;
        set => selection = value ?? new();
    }
}
