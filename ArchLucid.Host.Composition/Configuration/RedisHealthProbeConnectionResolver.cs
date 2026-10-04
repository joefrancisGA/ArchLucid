using Microsoft.Extensions.Configuration;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.Persistence.Coordination.Caching;

using KgProjectionCacheOptions = ArchLucid.KnowledgeGraph.Configuration.KnowledgeGraphProjectionCacheOptions;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Resolves the Redis connection string for health probing using the same precedence as distributed-cache registration
///     for distributed graph projection when enabled, otherwise LLM cache then hot-path cache (orphan projection strings
///     are ignored when the graph cache is in-process memory).
/// </summary>
internal static class RedisHealthProbeConnectionResolver
{
    /// <summary>
    ///     Resolves the Redis endpoint backing distributed graph projection cache entries and invalidation, matching
    ///     <see cref="ArchLucidDistributedCacheRegistrar.RegisterDistributedCacheForKnowledgeGraphProjectionIfNeeded" />.
    /// </summary>
    public static string? TryResolveGraphProjectionDistributedRedisConnectionString(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        KgProjectionCacheOptions projection =
            configuration.GetSection(KgProjectionCacheOptions.SectionName)
                .Get<KgProjectionCacheOptions>() ?? new KgProjectionCacheOptions();

        if (!projection.Enabled)
            return null;

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName)
                .Get<LlmCompletionResponseCacheOptions>() ?? new LlmCompletionResponseCacheOptions();

        bool redisConfigured = !string.IsNullOrWhiteSpace(projection.RedisConnectionString)
            || !string.IsNullOrWhiteSpace(llm.RedisConnectionString)
            || !string.IsNullOrWhiteSpace(hotPath.RedisConnectionString);

        GraphProjectionCacheBackend effectiveBackend = GraphProjectionCacheProviderResolver.ResolveEffectiveBackend(
            projection,
            hotPath.ExpectedApiReplicaCount,
            redisConfigured);

        bool distributedProjectionCache = projection.Backend == GraphProjectionCacheBackend.Distributed
            || effectiveBackend == GraphProjectionCacheBackend.Distributed;

        if (!distributedProjectionCache)
            return null;

        bool distributedCacheAlreadyRegistered =
            InferDistributedCacheRegisteredBeforeKnowledgeGraphProjection(hotPath, llm);

        string redis = ArchLucidDistributedCacheRegistrar.ResolveGraphProjectionRedisConnectionString(
            projection.RedisConnectionString,
            llm,
            hotPath,
            distributedCacheAlreadyRegistered);

        return string.IsNullOrEmpty(redis) ? null : redis;
    }

    public static string? TryResolveRedisHealthProbeConnectionString(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? graphProjectionRedis = TryResolveGraphProjectionDistributedRedisConnectionString(configuration);

        if (graphProjectionRedis is not null)
            return graphProjectionRedis;

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName)
                .Get<LlmCompletionResponseCacheOptions>() ?? new LlmCompletionResponseCacheOptions();

        if (InferDistributedCacheRegisteredBeforeKnowledgeGraphProjection(hotPath, llm))
        {
            string shared = ArchLucidDistributedCacheRegistrar.ResolveGraphProjectionRedisConnectionString(
                kgRedis: null,
                llm,
                hotPath,
                distributedCacheAlreadyRegistered: true);

            return string.IsNullOrEmpty(shared) ? null : shared;
        }

        if (!string.IsNullOrWhiteSpace(llm.RedisConnectionString))
            return llm.RedisConnectionString.Trim();

        string hotPathRedis = hotPath.RedisConnectionString?.Trim() ?? string.Empty;

        return string.IsNullOrEmpty(hotPathRedis) ? null : hotPathRedis;
    }

    /// <summary>
    ///     Mirrors <c>RegisterHotPathReadCaching</c> then <c>RegisterDistributedCacheForLlmCompletionIfNeeded</c> before
    ///     knowledge-graph projection cache registration.
    /// </summary>
    private static bool InferDistributedCacheRegisteredBeforeKnowledgeGraphProjection(
        HotPathCacheOptions hotPath,
        LlmCompletionResponseCacheOptions llm)
    {
        if (hotPath.Enabled)
        {
            string provider = HotPathCacheProviderResolver.ResolveEffectiveProvider(hotPath);

            if (string.Equals(provider, "Redis", StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(hotPath.RedisConnectionString))
                return true;
        }

        return llm.Enabled
            && string.Equals(llm.Provider, "Distributed", StringComparison.OrdinalIgnoreCase)
            && (!string.IsNullOrWhiteSpace(llm.RedisConnectionString)
                || !string.IsNullOrWhiteSpace(hotPath.RedisConnectionString));
    }
}
