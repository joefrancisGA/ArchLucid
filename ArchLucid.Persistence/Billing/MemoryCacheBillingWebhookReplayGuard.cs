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

    /// <inheritdoc />
    public Task<bool> HasSeenAsync(string providerName, string eventId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        return Task.FromResult(_memoryCache.TryGetValue(BuildCacheKey(providerName, eventId), out _));
    }

    /// <inheritdoc />
    public Task RememberAsync(string providerName, string eventId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        MemoryCacheEntryOptions entryOptions = new()
        {
            AbsoluteExpiration = _clock.GetUtcNow().Add(Retention),
            Size = 1,
        };

        _memoryCache.Set(BuildCacheKey(providerName, eventId), true, entryOptions);

        return Task.CompletedTask;
    }

    public Task<bool> TryRegisterEventAsync(string providerName, string eventId, CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string key = BuildCacheKey(providerName, eventId);
        
        if (_memoryCache.TryGetValue(key, out _))
            return Task.FromResult(false);

        MemoryCacheEntryOptions entryOptions = new()
        {
            AbsoluteExpiration = _clock.GetUtcNow().Add(Retention),
            Size = 1,
        };

        _memoryCache.Set(key, true, entryOptions);

        return Task.FromResult(true);
    }

    internal static string BuildCacheKey(string providerName, string eventId) =>
        $"billing-webhook-replay:{providerName.Trim().ToLowerInvariant()}:{eventId.Trim()}";
}
