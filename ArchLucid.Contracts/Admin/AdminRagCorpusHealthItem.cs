namespace ArchLucid.Contracts.Admin;

public sealed class AdminRagCorpusHealthItem
{
    public string CorpusKind
    {
        get;
        set;
    } = "";

    public int ChunkCount
    {
        get;
        set;
    }

    public DateTimeOffset? LastIndexedUtc
    {
        get;
        set;
    }

    public int EmbeddingDimension
    {
        get;
        set;
    }

    public bool IsStale
    {
        get;
        set;
    }
}
