namespace ArchLucid.KnowledgeGraph.Configuration;

/// <summary>Resolves <see cref="KnowledgeGraphProjectionCacheOptions.CacheProvider" /> <c>Auto</c> to an effective backend.</summary>
public static class GraphProjectionCacheProviderResolver
{
    /// <summary>
    ///     Returns <see cref="GraphProjectionCacheBackend.Distributed" /> when <c>Auto</c>, replica count &gt; 1, and Redis is
    ///     configured; otherwise memory.
    /// </summary>
    public static GraphProjectionCacheBackend ResolveEffectiveBackend(
        KnowledgeGraphProjectionCacheOptions options,
        int expectedApiReplicaCount,
        bool redisConnectionConfigured)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.CacheProvider == GraphProjectionCacheProvider.Memory)
            return GraphProjectionCacheBackend.Memory;

        if (options.CacheProvider == GraphProjectionCacheProvider.Distributed)
            return GraphProjectionCacheBackend.Distributed;

        if (expectedApiReplicaCount > 1 && redisConnectionConfigured)
            return GraphProjectionCacheBackend.Distributed;

        return GraphProjectionCacheBackend.Memory;
    }
}
