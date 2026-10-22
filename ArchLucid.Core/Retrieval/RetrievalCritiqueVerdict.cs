namespace ArchLucid.Core.Retrieval;

/// <summary>Structured critique outcome for iterative retrieve-critique-retry (TB-878).</summary>
public sealed class RetrievalCritiqueVerdict
{
    /// <summary>When true, the current hit set is sufficient for the query intent.</summary>
    public bool IsSufficient
    {
        get;
        init;
    }

    /// <summary>When <see cref="IsSufficient" /> is false, optional refined query for another retrieval round.</summary>
    public string? RefinedQueryText
    {
        get;
        init;
    }
}
