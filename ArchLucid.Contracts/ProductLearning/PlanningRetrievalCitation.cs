namespace ArchLucid.Contracts.ProductLearning;

/// <summary>Semantic retrieval prior surfaced during planning materialize (TB-879).</summary>
public sealed class PlanningRetrievalCitation
{
    public Guid SignalId
    {
        get;
        init;
    }

    public string? ThemeKey
    {
        get;
        init;
    }

    public string? Snippet
    {
        get;
        init;
    }
}
