namespace ArchLucid.Retrieval.Indexing;

/// <summary>Operator-visible last-indexed stamp for one retrieval corpus kind (TB-046).</summary>
public sealed class RetrievalCorpusFreshnessSummary
{
    public string CorpusKind
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset? LastIndexedUtc
    {
        get;
        init;
    }

    public int DocumentCount
    {
        get;
        init;
    }
}
