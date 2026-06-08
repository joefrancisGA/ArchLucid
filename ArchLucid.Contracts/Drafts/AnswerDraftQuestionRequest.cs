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
}
