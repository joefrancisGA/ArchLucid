namespace ArchLucid.Contracts.Drafts;

/// <summary>Pre-run reasoning reply anchored to a draft conversation thread (SAQ-013).</summary>
public sealed class DraftIntakeReasonResponse
{
    public Guid DraftId
    {
        get;
        set;
    }

    public Guid ConversationThreadId
    {
        get;
        set;
    }

    public DraftRequestStatus Status
    {
        get;
        set;
    }

    /// <summary>Natural-language assistant reply (or a short fallback when the LLM is unreachable).</summary>
    public string Answer
    {
        get;
        set;
    } = string.Empty;
}
