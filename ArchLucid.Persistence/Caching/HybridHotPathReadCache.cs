using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Caching;

/// <summary>
///     Hybrid (L1 + optional L2 Redis) implementation of <see cref="IHotPathReadCache" /> using typed cache slots so L1
///     hits avoid a manual JSON round-trip (TB-590).
/// </summary>
public sealed class HybridHotPathReadCache(
    HybridCache hybridCache,
    IOptionsMonitor<HotPathCacheOptions> optionsMonitor,
    ILogger<HybridHotPathReadCache> logger) : IHotPathReadCache
{
    private readonly HybridCache _hybridCache = hybridCache ?? throw new ArgumentNullException(nameof(hybridCache));

    private readonly ILogger<HybridHotPathReadCache> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<HotPathCacheOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly HotPathReadCacheSingleFlight _singleFlight = new();

    /// <inheritdoc />
    public async Task<T?> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T?>> factory,
        CancellationToken ct,
        int? absoluteExpirationSecondsOverride = null)
        where T : class
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(factory);

        HybridCacheEntryOptions entryOptions = ResolveEntryOptions(absoluteExpirationSecondsOverride);

        int factoryInvoked = 0;

        HotPathTypedCacheSlot<T> slot = await ReadSlotAsync().ConfigureAwait(false);

        if (slot.IsPresent && slot.Value is null)
        {
            // Omit cache key from logs — keys can embed tenant/role identifiers (cs/exposure-of-sensitive-information).
            _logger.LogWarning(
                "HotPath hybrid cache entry is invalid (present flag without value); refreshing.");

            await _hybridCache.RemoveAsync(key, ct).ConfigureAwait(false);
            slot = await ReadSlotAsync().ConfigureAwait(false);
        }

        if (factoryInvoked == 0)
            ArchLucidInstrumentation.RecordHotPathReadCacheHit();

        return slot.IsPresent ? slot.Value : null;

        ValueTask<HotPathTypedCacheSlot<T>> ReadSlotAsync()
        {
            return _hybridCache.GetOrCreateAsync(
                key,
                async innerCt => await _singleFlight.CoalesceAsync(
                    key,
                    async leaderCt =>
                    {
                        Interlocked.Exchange(ref factoryInvoked, 1);
                        ArchLucidInstrumentation.RecordHotPathReadCacheMiss();

                        T? created = await factory(leaderCt).ConfigureAwait(false);

                        return new HotPathTypedCacheSlot<T>(created is not null, created);
                    },
                    innerCt),
                entryOptions,
                cancellationToken: ct);
        }
    }

    /// <inheritdoc />
    public Task RemoveAsync(string key, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        return _hybridCache.RemoveAsync(key, ct).AsTask();
    }

    private HybridCacheEntryOptions ResolveEntryOptions(int? absoluteExpirationSecondsOverride)
    {
        HotPathCacheOptions options = _optionsMonitor.CurrentValue;
        int seconds = absoluteExpirationSecondsOverride ?? options.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = 60;

        seconds = Math.Clamp(seconds, 1, 3600);
        bool distributedL2Enabled = options.Enabled &&
            string.Equals(HotPathCacheProviderResolver.ResolveEffectiveProvider(options), "Redis", StringComparison.OrdinalIgnoreCase);

        return new HybridCacheEntryOptions
        {
            Expiration = TimeSpan.FromSeconds(seconds),
            LocalCacheExpiration = HotPathCacheProviderResolver.ResolveLocalCacheExpiration(options, distributedL2Enabled, seconds),
        };
    }
}
