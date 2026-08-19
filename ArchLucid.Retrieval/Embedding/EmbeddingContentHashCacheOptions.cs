namespace ArchLucid.Retrieval.Embedding;

/// <summary>In-process content-hash cache for <see cref="IEmbeddingService" />.</summary>
public sealed class EmbeddingContentHashCacheOptions
{
    public const string SectionPath = "Retrieval:EmbeddingCache";

    /// <summary>When false, registrations skip the caching decorator.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Absolute TTL for a cached vector (seconds; clamped 60–86400).</summary>
    public int AbsoluteExpirationSeconds
    {
        get;
        set;
    } = 3600;

    /// <summary>Approximate max entries (MemoryCache SizeLimit units; each vector Size = 1).</summary>
    public int MaxEntries
    {
        get;
        set;
    } = 4096;
}
