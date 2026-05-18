using Microsoft.Extensions.Configuration;

using ArchLucid.AgentRuntime;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.Persistence.Coordination.Caching;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Resolves the Redis connection string for health probing using the same precedence as distributed-cache registration
///     for knowledge-graph projection (projection explicit, then LLM cache, then hot-path cache).
/// </summary>
internal static class RedisHealthProbeConnectionResolver
{
    public static string? TryResolveRedisHealthProbeConnectionString(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        KnowledgeGraphProjectionCacheOptions projection =
            configuration.GetSection(KnowledgeGraphProjectionCacheOptions.SectionName)
                .Get<KnowledgeGraphProjectionCacheOptions>() ?? new KnowledgeGraphProjectionCacheOptions();

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName)
                .Get<LlmCompletionResponseCacheOptions>() ?? new LlmCompletionResponseCacheOptions();

        string? projectionRedis = projection.RedisConnectionString?.Trim();

        if (!string.IsNullOrEmpty(projectionRedis))
            return projectionRedis;

        if (!string.IsNullOrWhiteSpace(llm.RedisConnectionString))
            return llm.RedisConnectionString.Trim();

        string hotPathRedis = hotPath.RedisConnectionString.Trim();

        return string.IsNullOrEmpty(hotPathRedis) ? null : hotPathRedis;
    }
}
