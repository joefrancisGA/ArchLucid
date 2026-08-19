namespace ArchLucid.Persistence.Caching;

/// <summary>Read-through hot-path cache façade backed by <see cref="Microsoft.Extensions.Caching.Hybrid.HybridCache" />.</summary>
public interface IHotPathReadCache
{
    /// <summary>
    ///     Returns a cached instance or materializes via <paramref name="factory" />. <see langword="null" /> outcomes are
    ///     cached briefly (bounded TTL) to prevent stampedes alongside positive entries.
    /// </summary>
    /// <param name="absoluteExpirationSecondsOverride">
    ///     When set, overrides
    ///     <see cref="ArchLucid.Persistence.Coordination.Caching.HotPathCacheOptions.AbsoluteExpirationSeconds" /> for this
    ///     entry only (clamped between 1 and 3600 seconds).
    /// </param>
    Task<T?> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T?>> factory,
        CancellationToken ct,
        int? absoluteExpirationSecondsOverride = null)
        where T : class;

    /// <summary>Removes one key (e.g. after a successful write).</summary>
    Task RemoveAsync(string key, CancellationToken ct);
}
