namespace ArchLucid.Contracts.Risk;

public sealed class ExecutionContextItem
{
    public string ItemKey
    {
        get;
        set;
    } = null!;

    /// <summary>Key of the elicitation question that produced this item.</summary>
    public string ElicitationQuestionKey
    {
        get;
        set;
    } = null!;

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
