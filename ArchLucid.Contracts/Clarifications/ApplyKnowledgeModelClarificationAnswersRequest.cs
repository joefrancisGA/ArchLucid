using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Clarifications;

public sealed class ApplyKnowledgeModelClarificationAnswersRequest
{
    private Dictionary<string, string> answers = new(StringComparer.Ordinal);

    public Dictionary<string, string> Answers
    {
        get => answers;
        set => answers = value ?? new Dictionary<string, string>(StringComparer.Ordinal);
    }
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
