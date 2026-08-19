namespace ArchLucid.Retrieval.Indexing;

/// <summary>Last successful index metadata for a retrieval document (TB-046 / TB-047).</summary>
public sealed class RetrievalDocumentIndexState
{
    public string ContentHash
    {
        get;
        set;
    } = string.Empty;

    public string ChunkingFingerprint
    {
        get;
        set;
    } = string.Empty;

    public string CorpusKind
    {
        get;
        set;
    } = string.Empty;

    public DateTimeOffset LastIndexedUtc
    {
        get;
        set;
    }
}
