namespace ArchLucid.Contracts.Drafts;

/// <summary>Body for answering an elicitation question on a draft.</summary>
public sealed class AnswerDraftQuestionRequest
{
    public string QuestionKey
    {
        get;
        set;
    } = string.Empty;

    public string Answer
    {
        get;
        set;
    } = string.Empty;

    /// <summary>When true, allows capture while the draft is <c>RunSpawned</c> (Working presenter room, PC-09).</summary>
    public bool PresenterCapture
    {
        get;
        set;
    }

    /// <summary>Optional responder label stored on the asserted trail entry (defaults to <c>Room</c>).</summary>
    public string? ResponderLabel
    {
        get;
        set;
    }
}
