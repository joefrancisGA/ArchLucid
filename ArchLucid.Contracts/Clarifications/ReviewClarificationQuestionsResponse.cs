using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Clarifications;

/// <summary>Derived clarification questions for a committed review run.</summary>
public sealed class ReviewClarificationQuestionsResponse
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    private List<ReviewClarificationQuestion> questions = [];

    public List<ReviewClarificationQuestion> Questions
    {
        get => questions;
        set => questions = ContractCollectionDefaults.Coalesce(value);
    }

    public int TotalDerivedCount
    {
        get;
        set;
    }

    public bool ClarificationRoundAvailable
    {
        get;
        set;
    }

    public ReviewClarificationDelta? DeltaFromPriorRun
    {
        get;
        set;
    }
}
