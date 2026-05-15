namespace ArchLucid.KnowledgeGraph.Configuration;

/// <summary>In-process cache options for hydrated <see cref="Models.GraphSnapshot" /> projection reads keyed by authority scope + run + graph ids.</summary>
public sealed class KnowledgeGraphProjectionCacheOptions
{
    public const string SectionName = "ArchLucid:KnowledgeGraph:ProjectionCache";

    /// <summary>
    ///     Process-local <see cref="IMemoryCache" /> vs shared <see cref="Microsoft.Extensions.Caching.Distributed.IDistributedCache" />.
    /// </summary>
    public GraphProjectionCacheBackend Backend
    {
        get;
        set;
    } = GraphProjectionCacheBackend.Memory;

    /// <summary>
    ///     Optional Redis connection string for distributed projection caching when <see cref="Backend"/> is
    ///     <see cref="GraphProjectionCacheBackend.Distributed"/> and no <c>IDistributedCache</c> is registered yet.
    ///     Falls back to LLM / hot-path Redis strings in host composition when unset.
    /// </summary>
    public string? RedisConnectionString
    {
        get;
        set;
    }

    /// <summary>Disable read-through caching entirely (queries always hit persistent stores).</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>TTL applied to projection entries (<c>null</c> results are never cached).</summary>
    public int AbsoluteExpirationSeconds
    {
        get;
        set;
    } = 300;
}
