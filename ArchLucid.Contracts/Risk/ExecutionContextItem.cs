using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Risk;

public sealed class ExecutionContextItem
{
    private string itemKey = string.Empty;

    public string ItemKey
    {
        get => itemKey;
        set => itemKey = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>Key of the elicitation question that produced this item.</summary>
    private string elicitationQuestionKey = string.Empty;

    public string ElicitationQuestionKey
    {
        get => elicitationQuestionKey;
        set => elicitationQuestionKey = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public DisclosureState Disclosure
    {
        get;
        set;
    }

    public string? AssertedAnswerRef
    {
        get;
        set;
    }
}