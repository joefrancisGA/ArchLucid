namespace ArchLucid.Contracts.Clarifications;

public sealed class ApplyKnowledgeModelClarificationAnswersRequest
{
    public Dictionary<string, string> Answers
    {
        get;
        set;
    } = new(StringComparer.Ordinal);
}

public sealed class ApplyKnowledgeModelClarificationAnswersResponse
{
    public int AppliedCount
    {
        get;
        set;
    }

    public bool ReReviewTriggered
    {
        get;
        set;
    }

    public int MergedFindingCount
    {
        get;
        set;
    }

    public string? PartialScopeDisclaimer
    {
        get;
        set;
    }
}
