namespace ArchLucid.Core.Configuration;

/// <summary>In-process cache options for hydrated graph snapshot projection reads keyed by authority scope + run + graph ids.</summary>
public class KnowledgeGraphProjectionCacheOptions
{
    public const string SectionName = "ArchLucid:KnowledgeGraph:ProjectionCache";

    public const int DefaultAbsoluteExpirationSeconds = 3600;

    public const int DefaultMaxAbsoluteExpirationSeconds = 86400;

    /// <summary>Default per-entry byte cap (50 MiB) before bypassing in-process projection cache.</summary>
    public const long DefaultMaxSingleEntryBytes = 52_428_800;

    public GraphProjectionCacheBackend Backend
    {
        get;
        set;
    } = GraphProjectionCacheBackend.Memory;

    public GraphProjectionCacheProvider CacheProvider
    {
        get;
        set;
    } = GraphProjectionCacheProvider.Auto;

    public int? CacheTtlMinutes
    {
        get;
        set;
    }

    public string? RedisConnectionString
    {
        get;
        set;
    }

    public bool Enabled
    {
        get;
        set;
    } = true;

    public int AbsoluteExpirationSeconds
    {
        get;
        set;
    } = 3600;

    public int MaxAbsoluteExpirationSeconds
    {
        get;
        set;
    } = 86400;

    /// <summary>
    ///     Maximum estimated bytes for a single hydrated graph projection eligible for <see cref="IMemoryCache" /> storage.
    ///     Oversized snapshots are returned without caching.
    /// </summary>
    public long MaxSingleEntryBytes
    {
        get;
        set;
    } = DefaultMaxSingleEntryBytes;
}
