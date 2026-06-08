namespace ArchLucid.Contracts.Drafts;

/// <summary>Body for explicitly skipping an elicitation question on a draft (ADR 0050 transparency trail).</summary>
public sealed class SkipDraftQuestionRequest
{
    /// <summary>The <see cref="DraftElicitationQuestion.QuestionKey" /> being skipped.</summary>
    public string QuestionKey
    {
        get;
        set;
    } = string.Empty;
}
