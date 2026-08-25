using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Caching;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.KnowledgeGraph.Caching;
using KgProjectionCacheOptions = ArchLucid.KnowledgeGraph.Configuration.KnowledgeGraphProjectionCacheOptions;
using ArchLucid.KnowledgeGraph.Configuration;

using Microsoft.Extensions.Caching.Distributed;

using Polly;

using StackExchange.Redis;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Distributed cache, LLM completion response store, and host leader lease infrastructure.
/// </summary>
internal static class ArchLucidDistributedCacheRegistrar
{
    /// <summary>
    /// LLM completion cache + response store — same for Sql and InMemory storage (after Sql-only hot-path cache when applicable).
    /// </summary>
    public static void RegisterSharedDistributedCacheAndLlmCompletion(
        IServiceCollection services,
        IConfiguration configuration)
    {
        RegisterDistributedCacheForLlmCompletionIfNeeded(services, configuration);
        RegisterDistributedCacheForKnowledgeGraphProjectionIfNeeded(services, configuration);
        RegisterLlmCompletionResponseStore(services, configuration);
    }

    public static void RegisterDistributedCacheForKnowledgeGraphProjectionIfNeeded(
        IServiceCollection services,
        IConfiguration configuration)
    {
        KgProjectionCacheOptions kg =
            configuration.GetSection(KgProjectionCacheOptions.SectionName).Get<KgProjectionCacheOptions>()
            ?? new KgProjectionCacheOptions();

        if (kg.Backend != GraphProjectionCacheBackend.Distributed)
            return;

        if (services.Any(static d => d.ServiceType == typeof(IDistributedCache)))
            return;

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName).Get<LlmCompletionResponseCacheOptions>()
            ?? new LlmCompletionResponseCacheOptions();

        string? kgRedis = kg.RedisConnectionString?.Trim();

        string redis = !string.IsNullOrEmpty(kgRedis)
            ? kgRedis
            : !string.IsNullOrWhiteSpace(llm.RedisConnectionString)
                ? llm.RedisConnectionString!.Trim()
                : hotPath.RedisConnectionString.Trim();

        if (string.IsNullOrEmpty(redis))

            throw new InvalidOperationException(
                "ArchLucid:KnowledgeGraph:ProjectionCache:Backend is Distributed but no IDistributedCache is registered and no Redis connection string is available (configure ProjectionCache:RedisConnectionString, LlmCompletionCache:RedisConnectionString, or HotPathCache:RedisConnectionString).");


        services.AddStackExchangeRedisCache(o => o.Configuration = redis);
        RegisterGraphProjectionRedisPubSub(services, redis);
    }

    public static void RegisterHostLeaderLeaseInfrastructure(IServiceCollection services)
    {
        services.AddSingleton<HostInstanceIdentifier>();
        services.AddSingleton<ArchLucid.Core.Hosting.IHostProcessInstanceId, ArchLucid.Host.Core.Hosting.HostProcessInstanceIdAdapter>();
        services.AddSingleton<HostLeaderElectionCoordinator>();
    }

    public static void RegisterDistributedCacheForLlmCompletionIfNeeded(
        IServiceCollection services,
        IConfiguration configuration)
    {
        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName).Get<LlmCompletionResponseCacheOptions>()
            ?? new LlmCompletionResponseCacheOptions();

        if (!llm.Enabled || !string.Equals(llm.Provider, "Distributed", StringComparison.OrdinalIgnoreCase))
            return;

        if (services.Any(static d => d.ServiceType == typeof(IDistributedCache)))
            return;

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        string redis = string.IsNullOrWhiteSpace(llm.RedisConnectionString)
            ? hotPath.RedisConnectionString.Trim()
            : llm.RedisConnectionString.Trim();

        if (string.IsNullOrEmpty(redis))

            throw new InvalidOperationException(
                "LlmCompletionCache:Provider is Distributed but no IDistributedCache is registered and neither LlmCompletionCache:RedisConnectionString nor HotPathCache:RedisConnectionString is set.");


        services.AddStackExchangeRedisCache(o => o.Configuration = redis);
    }

    public static void RegisterLlmCompletionResponseStore(IServiceCollection services, IConfiguration configuration)
    {
        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName).Get<LlmCompletionResponseCacheOptions>()
            ?? new LlmCompletionResponseCacheOptions();

        if (!llm.Enabled)
            return;

        if (string.Equals(llm.Provider, "Distributed", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<ILlmCompletionResponseStore>(sp =>
            {
                ResiliencePipeline circuitBreaker = ArchLucid.AgentRuntime.LlmCompletionDistributedStoreResilienceDefaults.BuildCircuitBreakerPipeline(
                    sp.GetRequiredService<ILogger<ArchLucid.AgentRuntime.ResilientDistributedLlmCompletionResponseStore>>());

                MemoryLlmCompletionResponseStore fallback = new(Math.Max(1, llm.MaxEntries));

                return new ArchLucid.AgentRuntime.ResilientDistributedLlmCompletionResponseStore(
                    new DistributedLlmCompletionResponseStore(sp.GetRequiredService<IDistributedCache>()),
                    fallback,
                    circuitBreaker,
                    sp.GetRequiredService<ILogger<ArchLucid.AgentRuntime.ResilientDistributedLlmCompletionResponseStore>>());
            });

            return;
        }

        int maxEntries = Math.Max(1, llm.MaxEntries);
        services.AddSingleton<ILlmCompletionResponseStore>(_ => new MemoryLlmCompletionResponseStore(maxEntries));
    }

    private static void RegisterGraphProjectionRedisPubSub(IServiceCollection services, string redisConnectionString)
    {
        if (services.Any(static d => d.ServiceType == typeof(IConnectionMultiplexer)))
            return;

        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(ConfigurationOptions.Parse(redisConnectionString)));
        services.AddSingleton<IGraphProjectionCacheInvalidationBroadcaster, RedisGraphProjectionCacheInvalidationBroadcaster>();
        services.AddHostedService<GraphProjectionCacheInvalidationSubscriberHostedService>();
    }
}
