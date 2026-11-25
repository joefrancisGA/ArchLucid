using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Risk;

public sealed class SuggestedConcern
{
    private string concernId = string.Empty;

    public string ConcernId
    {
        get => concernId;
        set => concernId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>Plain language, specific, references named entities from customer context.</summary>
    private string statement = string.Empty;

    public string Statement
    {
        get => statement;
        set => statement = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>Must contain at least two held facts (named entities) to pass the quality gate.</summary>
    private List<string> relatedFactRefs = [];

    public List<string> RelatedFactRefs
    {
        get => relatedFactRefs;
        set => relatedFactRefs = ContractCollectionDefaults.Coalesce(value);
    }

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