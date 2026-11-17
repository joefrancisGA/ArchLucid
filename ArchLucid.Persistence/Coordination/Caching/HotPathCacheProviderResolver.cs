namespace ArchLucid.Persistence.Coordination.Caching;

/// <summary>Resolves <see cref="HotPathCacheOptions.Provider" /> <c>Auto</c> to an effective backing store.</summary>
public static class HotPathCacheProviderResolver
{
    /// <summary>
    ///     Returns <c>Redis</c> or <c>Memory</c> for registration. <c>Auto</c> maps to Redis only when replica count &gt; 1
    ///     and a Redis connection string exists.
    /// </summary>
    public static string ResolveEffectiveProvider(HotPathCacheOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string? raw = options.Provider;

        if (string.IsNullOrWhiteSpace(raw))
            return "Memory";

        if (!string.Equals(raw, "Auto", StringComparison.OrdinalIgnoreCase))
            return raw.Trim();

        if (options.ExpectedApiReplicaCount > 1 &&
            !string.IsNullOrWhiteSpace(options.RedisConnectionString))
            return "Redis";

        return "Memory";
    }

    /// <summary>Bounds local cache lifetime when Redis is the shared backing store.</summary>
    public static TimeSpan ResolveLocalCacheExpiration(
        HotPathCacheOptions options,
        bool distributedL2Enabled,
        int absoluteExpirationSeconds)
    {
        if (!distributedL2Enabled)
            return TimeSpan.FromSeconds(absoluteExpirationSeconds);

        int localSeconds = options.LocalCacheExpirationSeconds;

        if (localSeconds <= 0)
            localSeconds = Math.Clamp(absoluteExpirationSeconds / 4, 1, 15);
        else
            localSeconds = Math.Clamp(localSeconds, 1, absoluteExpirationSeconds);

        return TimeSpan.FromSeconds(localSeconds);
    }
}
