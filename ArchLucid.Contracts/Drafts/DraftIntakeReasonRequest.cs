namespace ArchLucid.Contracts.Drafts;

/// <summary>Body for pre-run Socratic reasoning on a draft (<c>POST /v1/architecture/draft/{draftId}/reason</c>, SAQ-013).</summary>
public sealed class DraftIntakeReasonRequest
{
    /// <summary>Operator or requester message to the intake reasoning surface.</summary>
    public string Message
    {
        get;
        set;
    } = string.Empty;
}
