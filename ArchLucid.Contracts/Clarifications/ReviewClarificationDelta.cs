using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Clarifications;

/// <summary>Question-id delta between a prior review run and the current run.</summary>
public sealed class ReviewClarificationDelta
{
    public string PriorRunId
    {
        get;
        set;
    } = string.Empty;

    private List<string> resolvedByEvidenceQuestionIds = [];

    public List<string> ResolvedByEvidenceQuestionIds
    {
        get => resolvedByEvidenceQuestionIds;
        set => resolvedByEvidenceQuestionIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> resolvedByAssertionQuestionIds = [];

    public List<string> ResolvedByAssertionQuestionIds
    {
        get => resolvedByAssertionQuestionIds;
        set => resolvedByAssertionQuestionIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> stillOpenQuestionIds = [];

    public List<string> StillOpenQuestionIds
    {
        get => stillOpenQuestionIds;
        set => stillOpenQuestionIds = ContractCollectionDefaults.Coalesce(value);
    }
}
