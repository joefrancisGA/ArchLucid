using System.Text.Json;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Caching;

/// <summary>
///     Hybrid (L1 + optional L2 Redis) implementation of <see cref="IHotPathReadCache" /> using JSON payloads aligned with
///     <see cref="JsonEntitySerializer.EntityJsonOptions" />.
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

        HotPathWireEnvelope envelope = await _hybridCache
            .GetOrCreateAsync(
                key,
                async innerCt =>
                {
                    T? created = await factory(innerCt);

                    if (created is null)
                        return new HotPathWireEnvelope(false, null);

                    byte[] payload = JsonSerializer.SerializeToUtf8Bytes(created, JsonEntitySerializer.EntityJsonOptions);

                    return new HotPathWireEnvelope(true, payload);
                },
                entryOptions,
                cancellationToken: ct)
            .ConfigureAwait(false);

        if (!envelope.HasValue)
            return null;

        if (envelope.Payload is not { Length: > 0 })
        {
            _logger.LogWarning(
                "HotPath hybrid cache entry for key {CacheKey} is invalid (missing payload); refreshing.",
                LogSanitizer.Sanitize(key));

            await _hybridCache.RemoveAsync(key, ct).ConfigureAwait(false);

            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(envelope.Payload, JsonEntitySerializer.EntityJsonOptions);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(
                ex,
                "HotPath hybrid cache entry for key {CacheKey} is corrupt; refreshing.",
                LogSanitizer.Sanitize(key));

            await _hybridCache.RemoveAsync(key, ct).ConfigureAwait(false);

            return null;
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
        int seconds =
            absoluteExpirationSecondsOverride ?? _optionsMonitor.CurrentValue.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = 60;

        seconds = Math.Clamp(seconds, 1, 3600);
        TimeSpan ttl = TimeSpan.FromSeconds(seconds);

        return new HybridCacheEntryOptions
        {
            Expiration = ttl,
            LocalCacheExpiration = ttl
        };
    }
}
