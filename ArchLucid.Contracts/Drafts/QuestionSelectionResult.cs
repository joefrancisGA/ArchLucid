namespace ArchLucid.Contracts.Drafts;

/// <summary>Output of the deterministic L0/L1 question selection engine (ADR 0051).</summary>
public sealed class QuestionSelectionResult
{
    /// <summary>All selected questions in deterministic display order (L0 then L1).</summary>
    public IReadOnlyList<DraftElicitationQuestion> AllQuestions
    {
        get;
        init;
    } = [];

    /// <summary>MUST-tier keys still unanswered on the draft document.</summary>
    public IReadOnlyList<string> RequiredMustQuestionKeys
    {
        get;
        init;
    } = [];

    /// <summary>MUST-tier questions still awaiting answers (subset of <see cref="AllQuestions" />).</summary>
    public IReadOnlyList<DraftElicitationQuestion> PendingMustQuestions
    {
        get;
        init;
    } = [];
}
