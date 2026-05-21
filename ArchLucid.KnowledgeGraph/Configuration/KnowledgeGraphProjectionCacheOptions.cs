namespace ArchLucid.KnowledgeGraph.Configuration;

/// <summary>In-process cache options for hydrated <see cref="Models.GraphSnapshot" /> projection reads keyed by authority scope + run + graph ids.</summary>
public sealed class KnowledgeGraphProjectionCacheOptions
{
    public const string SectionName = "ArchLucid:KnowledgeGraph:ProjectionCache";

    public const int DefaultAbsoluteExpirationSeconds = 3600;

    public const int DefaultMaxAbsoluteExpirationSeconds = 86400;

    /// <summary>
    ///     Process-local <see cref="IMemoryCache" /> vs shared <see cref="Microsoft.Extensions.Caching.Distributed.IDistributedCache" />.
    /// </summary>
    public GraphProjectionCacheBackend Backend
    {
        get;
        set;
    } = GraphProjectionCacheBackend.Memory;

    /// <summary>
    ///     High-level provider selection (<c>Auto</c> picks distributed when replica count &gt; 1 and Redis is configured).
    /// </summary>
    public GraphProjectionCacheProvider CacheProvider
    {
        get;
        set;
    } = GraphProjectionCacheProvider.Auto;

    /// <summary>Cache TTL in minutes (maps to <see cref="AbsoluteExpirationSeconds" /> when set).</summary>
    public int? CacheTtlMinutes
    {
        get;
        set;
    }

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
    } = 3600;

    /// <summary>Maximum operator-configurable TTL in seconds (caps stale-cache risk).</summary>
    public int MaxAbsoluteExpirationSeconds
    {
        get;
        set;
    } = 86400;
}
