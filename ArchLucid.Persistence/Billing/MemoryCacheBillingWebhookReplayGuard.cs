using System.Collections.Concurrent;

using ArchLucid.Core.Billing;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Persistence.Billing;

/// <summary>Tracks processed billing webhook event ids for 24 hours to block replay attempts.</summary>
public sealed class MemoryCacheBillingWebhookReplayGuard(IMemoryCache memoryCache, TimeProvider clock) : IBillingWebhookReplayGuard
{
    internal static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly ConcurrentDictionary<string, byte> _claimedKeys = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<bool> HasSeenAsync(string providerName, string eventId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(providerName, eventId);

        return Task.FromResult(
            _claimedKeys.ContainsKey(cacheKey)
            || _memoryCache.TryGetValue(cacheKey, out _));
    }

    /// <inheritdoc />
    public Task RememberAsync(string providerName, string eventId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(providerName, eventId);
        _claimedKeys.TryAdd(cacheKey, 0);
        _memoryCache.Set(cacheKey, true, CreateEntryOptions(cacheKey));

        return Task.CompletedTask;
    }

    public Task<bool> TryRegisterEventAsync(string providerName, string eventId, CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(providerName, eventId);

        if (!_claimedKeys.TryAdd(cacheKey, 0))
            return Task.FromResult(false);

        try
        {
            _memoryCache.Set(cacheKey, true, CreateEntryOptions(cacheKey));
        }
        catch
        {
            _claimedKeys.TryRemove(cacheKey, out _);

            throw;
        }

        return Task.FromResult(true);
    }

    private MemoryCacheEntryOptions CreateEntryOptions(string cacheKey)
    {
        MemoryCacheEntryOptions options = new()
        {
            AbsoluteExpiration = _clock.GetUtcNow().Add(Retention),
            Size = 1,
        };

        options.RegisterPostEvictionCallback(
            static (key, _, _, state) =>
            {
                if (key is not string evictedKey || state is not ConcurrentDictionary<string, byte> claimedKeys)
                    return;

                claimedKeys.TryRemove(evictedKey, out _);
            },
            _claimedKeys);

        return options;
    }

    internal static string BuildCacheKey(string providerName, string eventId) =>
        $"billing-webhook-replay:{providerName.Trim().ToLowerInvariant()}:{eventId.Trim().ToLowerInvariant()}";
}
