namespace ArchLucid.Contracts.Risk;

public sealed class SuggestedConcern
{
    public string ConcernId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    /// <summary>Plain language, specific, references named entities from customer context.</summary>
    public string Statement
    {
        get;
        set;
    } = null!;

    /// <summary>Must contain at least two held facts (named entities) to pass the quality gate.</summary>
    public List<string> RelatedFactRefs
    {
        get;
        set;
    } = [];

    public ConcernSource Source
    {
        get;
        set;
    }

    public RiskConsequence Consequence
    {
        get;
        set;
    }

    public ReversibilityClass Reversibility
    {
        get;
        set;
    }
}
