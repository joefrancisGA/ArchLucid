namespace ArchLucid.Contracts.Clarifications;

/// <summary>Derived clarification questions for a committed review run.</summary>
public sealed class ReviewClarificationQuestionsResponse
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public List<ReviewClarificationQuestion> Questions
    {
        get;
        set;
    } = [];

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
