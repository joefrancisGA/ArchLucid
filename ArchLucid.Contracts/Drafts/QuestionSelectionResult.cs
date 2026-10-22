using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Output of the deterministic L0/L1 question selection engine (ADR 0051).</summary>
public sealed class QuestionSelectionResult
{
    /// <summary>All selected questions in deterministic display order (L0 then L1).</summary>
    private IReadOnlyList<DraftElicitationQuestion> allQuestions = [];

    public IReadOnlyList<DraftElicitationQuestion> AllQuestions
    {
        get => allQuestions;
        init => allQuestions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>MUST-tier keys still unanswered on the draft document.</summary>
    private IReadOnlyList<string> requiredMustQuestionKeys = [];

    public IReadOnlyList<string> RequiredMustQuestionKeys
    {
        get => requiredMustQuestionKeys;
        init => requiredMustQuestionKeys = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>MUST-tier questions still awaiting answers (subset of <see cref="AllQuestions" />).</summary>
    private IReadOnlyList<DraftElicitationQuestion> pendingMustQuestions = [];

    public IReadOnlyList<DraftElicitationQuestion> PendingMustQuestions
    {
        get => pendingMustQuestions;
        init => pendingMustQuestions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
