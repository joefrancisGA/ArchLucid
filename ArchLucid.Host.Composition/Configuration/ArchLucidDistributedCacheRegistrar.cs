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
using Microsoft.Extensions.Hosting;

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

        if (!kg.Enabled)
            return;

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName).Get<LlmCompletionResponseCacheOptions>()
            ?? new LlmCompletionResponseCacheOptions();

        bool redisConfigured = !string.IsNullOrWhiteSpace(kg.RedisConnectionString)
            || !string.IsNullOrWhiteSpace(llm.RedisConnectionString)
            || !string.IsNullOrWhiteSpace(hotPath.RedisConnectionString);

        GraphProjectionCacheBackend effectiveBackend = GraphProjectionCacheProviderResolver.ResolveEffectiveBackend(
            kg,
            hotPath.ExpectedApiReplicaCount,
            redisConfigured);

        bool distributedProjectionCache = kg.Backend == GraphProjectionCacheBackend.Distributed
            || effectiveBackend == GraphProjectionCacheBackend.Distributed;

        if (!distributedProjectionCache)
            return;

        string? kgRedis = kg.RedisConnectionString?.Trim();

        bool distributedCacheAlreadyRegistered = services.Any(static d => d.ServiceType == typeof(IDistributedCache));

        string redis = ResolveGraphProjectionRedisConnectionString(
            kgRedis,
            llm,
            hotPath,
            distributedCacheAlreadyRegistered);

        if (string.IsNullOrEmpty(redis))

            throw new InvalidOperationException(
                "ArchLucid:KnowledgeGraph:ProjectionCache:Backend is Distributed but no IDistributedCache is registered and no Redis connection string is available (configure ProjectionCache:RedisConnectionString, LlmCompletionCache:RedisConnectionString, or HotPathCache:RedisConnectionString).");


        if (!distributedCacheAlreadyRegistered)
            services.AddStackExchangeRedisCache(o => o.Configuration = redis);

        RegisterGraphProjectionRedisPubSub(services, redis);
    }

    internal static string ResolveGraphProjectionRedisConnectionString(
        string? kgRedis,
        LlmCompletionResponseCacheOptions llm,
        HotPathCacheOptions hotPath,
        bool distributedCacheAlreadyRegistered)
    {
        if (distributedCacheAlreadyRegistered)
        return ResolveAlreadyRegisteredDistributedCacheRedisConnectionString(llm, hotPath, kgRedis);

        if (!string.IsNullOrEmpty(kgRedis))
            return kgRedis;

        return ResolveLlmOrHotPathRedisConnectionString(llm, hotPath);
    }

    private static string ResolveAlreadyRegisteredDistributedCacheRedisConnectionString(
        LlmCompletionResponseCacheOptions llm,
        HotPathCacheOptions hotPath,
        string? kgRedis)
    {
        if (hotPath.Enabled)
        {
            string provider = HotPathCacheProviderResolver.ResolveEffectiveProvider(hotPath);

            if (string.Equals(provider, "Redis", StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(hotPath.RedisConnectionString))
                return hotPath.RedisConnectionString.Trim();
        }

        return ResolveLlmOrHotPathRedisConnectionString(llm, hotPath, kgRedis);
    }

    private static string ResolveLlmOrHotPathRedisConnectionString(
        LlmCompletionResponseCacheOptions llm,
        HotPathCacheOptions hotPath,
        string? kgRedis = null)
    {
        if (!string.IsNullOrWhiteSpace(llm.RedisConnectionString))
            return llm.RedisConnectionString.Trim();

        if (!string.IsNullOrWhiteSpace(hotPath.RedisConnectionString))
            return hotPath.RedisConnectionString.Trim();

        return kgRedis?.Trim() ?? string.Empty;
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
        if (!services.Any(static d => d.ServiceType == typeof(IConnectionMultiplexer)))
        {
            services.AddSingleton<IConnectionMultiplexer>(_ =>
                ConnectionMultiplexer.Connect(ConfigurationOptions.Parse(redisConnectionString)));
        }

        if (!services.Any(static d =>
                d.ServiceType == typeof(IGraphProjectionCacheInvalidationBroadcaster)
                && d.ImplementationType == typeof(RedisGraphProjectionCacheInvalidationBroadcaster)))
        {
            services.AddSingleton<IGraphProjectionCacheInvalidationBroadcaster, RedisGraphProjectionCacheInvalidationBroadcaster>();
        }

        if (!services.Any(static d =>
                d.ServiceType == typeof(IHostedService)
                && d.ImplementationType == typeof(GraphProjectionCacheInvalidationSubscriberHostedService)))
        {
            services.AddHostedService<GraphProjectionCacheInvalidationSubscriberHostedService>();
        }
    }
}
