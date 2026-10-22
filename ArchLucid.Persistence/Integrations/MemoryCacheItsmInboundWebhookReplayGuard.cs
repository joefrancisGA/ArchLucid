using System.Collections.Concurrent;

using ArchLucid.Core.Integrations.Itsm;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Persistence.Integrations;

/// <summary>Tracks processed ITSM inbound webhook event ids for 24 hours to block replay mutations (TB-968).</summary>
public sealed class MemoryCacheItsmInboundWebhookReplayGuard(IMemoryCache memoryCache, TimeProvider clock)
    : IItsmInboundWebhookReplayGuard
{
    internal static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly ConcurrentDictionary<string, object> _claimedKeys = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<bool> HasSeenAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(tenantId, providerName, eventId);

        return Task.FromResult(
            _claimedKeys.ContainsKey(cacheKey)
            || _memoryCache.TryGetValue(cacheKey, out _));
    }

    /// <inheritdoc />
    public Task<bool> TryClaimAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(tenantId, providerName, eventId);

        object claimToken = new();

        if (!_claimedKeys.TryAdd(cacheKey, claimToken))
            return Task.FromResult(false);

        try
        {
            _memoryCache.Set(cacheKey, true, CreateEntryOptions(cacheKey, claimToken));
        }
        catch
        {
            RemoveClaimIfCurrent(cacheKey, claimToken, _claimedKeys);

            throw;
        }

        return Task.FromResult(true);
    }

    /// <inheritdoc />
    public Task RememberAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(tenantId, providerName, eventId);
        object claimToken = new();
        _claimedKeys.AddOrUpdate(cacheKey, claimToken, (_, _) => claimToken);
        _memoryCache.Set(cacheKey, true, CreateEntryOptions(cacheKey, claimToken));

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task ReleaseAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(tenantId, providerName, eventId);
        _memoryCache.Remove(cacheKey);
        _claimedKeys.TryRemove(cacheKey, out _);

        return Task.CompletedTask;
    }

    private MemoryCacheEntryOptions CreateEntryOptions(string cacheKey, object claimToken)
    {
        MemoryCacheEntryOptions options = new()
        {
            AbsoluteExpiration = _clock.GetUtcNow().Add(Retention),
            Size = 1,
        };

        options.RegisterPostEvictionCallback(
            static (key, _, _, state) =>
            {
                if (key is not string evictedKey || state is not ClaimEvictionState evictionState)
                    return;

                RemoveClaimIfCurrent(evictedKey, evictionState.ClaimToken, evictionState.ClaimedKeys);
            },
            new ClaimEvictionState(_claimedKeys, claimToken));

        return options;
    }

    private static void RemoveClaimIfCurrent(
        string cacheKey,
        object claimToken,
        ConcurrentDictionary<string, object> claimedKeys) =>
        ((ICollection<KeyValuePair<string, object>>)claimedKeys)
            .Remove(new KeyValuePair<string, object>(cacheKey, claimToken));

    private sealed record ClaimEvictionState(
        ConcurrentDictionary<string, object> ClaimedKeys,
        object ClaimToken);

    internal static string BuildCacheKey(Guid tenantId, string providerName, string eventId) =>
        $"itsm-inbound-webhook-replay:{tenantId:D}:{providerName.Trim().ToLowerInvariant()}:{eventId.Trim().ToLowerInvariant()}";
}
