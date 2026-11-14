using ArchLucid.Core.Billing;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Persistence.Billing;

/// <summary>Tracks processed billing webhook event ids for 24 hours to block replay attempts.</summary>
public sealed class MemoryCacheBillingWebhookReplayGuard(IMemoryCache memoryCache, TimeProvider clock) : IBillingWebhookReplayGuard
{
    internal static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(5);

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    // A cache entry may be evicted for capacity or compaction before its replay window ends.
    // Keep an independent, time-bounded claim ledger so those evictions cannot permit replays.
    private readonly Dictionary<string, DateTimeOffset> _claimedKeys = new(StringComparer.Ordinal);
    private readonly object _gate = new();
    private DateTimeOffset _nextCleanupUtc = DateTimeOffset.MinValue;

    /// <inheritdoc />
    public Task<bool> HasSeenAsync(string providerName, string eventId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        string cacheKey = BuildCacheKey(providerName, eventId);

        lock (_gate)
        {
            DateTimeOffset now = _clock.GetUtcNow();
            CleanupExpiredClaims(now);

            return Task.FromResult(
                _claimedKeys.TryGetValue(cacheKey, out DateTimeOffset expiresAt)
                && expiresAt > now);
        }
    }

    /// <inheritdoc />
    public Task RememberAsync(string providerName, string eventId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        Register(BuildCacheKey(providerName, eventId), rejectDuplicate: false);
        return Task.CompletedTask;
    }

    public Task<bool> TryRegisterEventAsync(string providerName, string eventId, CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        return Task.FromResult(Register(BuildCacheKey(providerName, eventId), rejectDuplicate: true));
    }

    private bool Register(string cacheKey, bool rejectDuplicate)
    {
        // Serialize the claim and cache write. A failed cache write must not leave a
        // successful claim behind, and concurrent duplicate registrations must be atomic.
        lock (_gate)
        {
            DateTimeOffset now = _clock.GetUtcNow();
            CleanupExpiredClaims(now);

            bool hadPrevious = _claimedKeys.TryGetValue(cacheKey, out DateTimeOffset previousExpiration);
            if (rejectDuplicate && hadPrevious && previousExpiration > now)
                return false;

            DateTimeOffset expiresAt = now.Add(Retention);
            _claimedKeys[cacheKey] = expiresAt;

            try
            {
                _memoryCache.Set(
                    cacheKey,
                    true,
                    new MemoryCacheEntryOptions
                    {
                        AbsoluteExpiration = expiresAt,
                        Size = 1,
                    });
            }
            catch
            {
                if (hadPrevious)
                    _claimedKeys[cacheKey] = previousExpiration;
                else
                    _claimedKeys.Remove(cacheKey);

                throw;
            }

            return true;
        }
    }

    private void CleanupExpiredClaims(DateTimeOffset now)
    {
        if (now < _nextCleanupUtc)
            return;

        List<string> expiredKeys = new();
        foreach (KeyValuePair<string, DateTimeOffset> claim in _claimedKeys)
        {
            if (claim.Value <= now)
                expiredKeys.Add(claim.Key);
        }

        foreach (string expiredKey in expiredKeys)
            _claimedKeys.Remove(expiredKey);

        _nextCleanupUtc = now.Add(CleanupInterval);
    }

    internal static string BuildCacheKey(string providerName, string eventId) =>
        $"billing-webhook-replay:{providerName.Trim().ToLowerInvariant()}:{eventId.Trim().ToLowerInvariant()}";
}
