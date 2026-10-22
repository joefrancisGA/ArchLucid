using ArchLucid.Persistence.Coordination.Caching;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class HotPathCacheRules
{
    public static void Collect(IConfiguration configuration, IWebHostEnvironment environment, List<string> errors)
    {
        HotPathCacheOptions opts =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        if (!opts.Enabled)
            return;

        string provider = opts.Provider;

        if (!string.Equals(provider, "Memory", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(provider, "Redis", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(provider, "Auto", StringComparison.OrdinalIgnoreCase))

            errors.Add(
                "HotPathCache:Provider must be 'Memory', 'Redis', or 'Auto' when HotPathCache:Enabled is true.");

        if (string.Equals(provider, "Redis", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(opts.RedisConnectionString))

            errors.Add("HotPathCache:RedisConnectionString is required when HotPathCache:Provider is Redis.");

        CollectMultiReplicaCoherencyErrors(opts, environment, errors);

        if (opts.AbsoluteExpirationSeconds > 3600)

            errors.Add("HotPathCache:AbsoluteExpirationSeconds cannot exceed 3600.");
    }

    /// <summary>
    ///     When scale-out is declared, the effective hot-path cache must be Redis outside Development. In Development,
    ///     <see cref="Hosted.HotPathMemoryReplicaCoherenceHostedLogger" /> emits the advisory warning instead.
    /// </summary>
    private static void CollectMultiReplicaCoherencyErrors(
        HotPathCacheOptions opts,
        IWebHostEnvironment environment,
        List<string> errors)
    {
        if (opts.ExpectedApiReplicaCount <= 1)
            return;

        string effectiveProvider = HotPathCacheProviderResolver.ResolveEffectiveProvider(opts);

        if (!string.Equals(effectiveProvider, "Memory", StringComparison.OrdinalIgnoreCase))
            return;

        if (environment.IsDevelopment())
            return;

        errors.Add(
            "HotPathCache effective provider resolves to Memory while HotPathCache:ExpectedApiReplicaCount is greater than 1 outside Development. "
            + "Set HotPathCache:Provider=Redis with HotPathCache:RedisConnectionString, or HotPathCache:Provider=Auto with a Redis connection string, for cache coherence across API replicas.");
    }
}
