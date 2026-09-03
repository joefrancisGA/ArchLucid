using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Hot-path read caching and reference-data repository decorator registrations.
/// </summary>
internal static partial class ArchLucidReferenceDataHotPathRegistrar
{
    public static void RegisterHotPathReadCaching(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<HotPathCacheOptions>(
            configuration.GetSection(HotPathCacheOptions.SectionName));

        HotPathCacheOptions snapshot = configuration
                                           .GetSection(HotPathCacheOptions.SectionName)
                                           .Get<HotPathCacheOptions>()
                                       ?? new HotPathCacheOptions();

        if (!snapshot.Enabled)
        {
            // Hot-path repository decorators stay off; optional consumers (e.g. `GET /v1/demo/preview`) still use
            // IHotPathReadCache without enabling SQL hot-path repository decorators.
            RegisterHybridCacheCore(services, snapshot, distributedL2Enabled: false);
            services.AddSingleton<IHotPathReadCache, HybridHotPathReadCache>();

            return;
        }

        string provider = HotPathCacheProviderResolver.ResolveEffectiveProvider(snapshot);
        bool distributedL2Enabled = string.Equals(provider, "Redis", StringComparison.OrdinalIgnoreCase);

        if (string.Equals(provider, "Memory", StringComparison.OrdinalIgnoreCase) &&
            snapshot.ExpectedApiReplicaCount > 1)
            services.AddHostedService<HotPathMemoryReplicaCoherenceHostedLogger>();

        if (distributedL2Enabled)
        {
            string redis = snapshot.RedisConnectionString.Trim();

            if (string.IsNullOrEmpty(redis))

                throw new InvalidOperationException(
                    "HotPathCache:RedisConnectionString is required when HotPathCache:Provider is Redis.");


            TryRegisterStackExchangeRedisDistributedCache(services, redis);
            services.AddHostedService<HotPathRedisDistributedCacheHostedLogger>();
        }

        RegisterHybridCacheCore(services, snapshot, distributedL2Enabled);
        services.AddSingleton<IHotPathReadCache, HybridHotPathReadCache>();
    }

    public static TimeSpan ResolveLocalCacheExpiration(
        HotPathCacheOptions snapshot,
        bool distributedL2Enabled,
        int absoluteExpirationSeconds)
    {
        if (!distributedL2Enabled)
            return TimeSpan.FromSeconds(absoluteExpirationSeconds);

        int localSeconds = snapshot.LocalCacheExpirationSeconds;

        if (localSeconds <= 0)
            localSeconds = Math.Clamp(absoluteExpirationSeconds / 4, 1, 15);
        else
            localSeconds = Math.Clamp(localSeconds, 1, absoluteExpirationSeconds);

        return TimeSpan.FromSeconds(localSeconds);
    }

    /// <summary>
    ///     Registers slowly changing / reference-data repository decorators when <c>HotPathCache:Enabled</c>
    ///     (authz middleware, tenant gate, settings, policy-pack versions/catalog, alert rules, IdP/sign-in domains).
    /// </summary>
    public static void RegisterReferenceDataHotPathRepositories(
        IServiceCollection services,
        IConfiguration configuration)
    {
        HotPathCacheOptions hotPath = configuration
                                          .GetSection(HotPathCacheOptions.SectionName)
                                          .Get<HotPathCacheOptions>()
                                      ?? new HotPathCacheOptions();

        RegisterGovernanceReferenceDataHotPathRepositories(services, hotPath);
        RegisterTenancyReferenceDataHotPathRepositories(services, hotPath);
        RegisterAlertsReferenceDataHotPathRepositories(services, hotPath);
    }

    private static void RegisterHybridCacheCore(
        IServiceCollection services,
        HotPathCacheOptions snapshot,
        bool distributedL2Enabled)
    {
        int seconds = snapshot.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = 60;

        seconds = Math.Clamp(seconds, 1, 3600);
        TimeSpan distributedTtl = TimeSpan.FromSeconds(seconds);
        TimeSpan localTtl = ResolveLocalCacheExpiration(snapshot, distributedL2Enabled, seconds);

        services.AddHybridCache(options =>
        {
            options.MaximumPayloadBytes = 16 * 1024 * 1024;

            options.DefaultEntryOptions = new HybridCacheEntryOptions
            {
                Expiration = distributedTtl,
                LocalCacheExpiration = localTtl
            };
        });
    }

    /// <summary>
    ///     Registers StackExchange Redis backing for <see cref="IDistributedCache" /> when none is present (shared with LLM
    ///     distributed completion store when both are enabled).
    /// </summary>
    private static void TryRegisterStackExchangeRedisDistributedCache(IServiceCollection services, string redis)
    {
        if (services.Any(static d => d.ServiceType == typeof(IDistributedCache)))
            return;

        services.AddStackExchangeRedisCache(o => o.Configuration = redis);
    }
}
