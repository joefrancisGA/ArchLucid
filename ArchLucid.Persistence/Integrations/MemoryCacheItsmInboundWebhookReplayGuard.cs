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

        return Task.FromResult(_memoryCache.TryGetValue(BuildCacheKey(tenantId, providerName, eventId), out _));
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

        bool claimed = false;

        _ = _memoryCache.GetOrCreate(
            BuildCacheKey(tenantId, providerName, eventId),
            entry =>
            {
                claimed = true;
                ConfigureEntry(entry);

                return true;
            });

        return Task.FromResult(claimed);
    }

    /// <inheritdoc />
    public Task RememberAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = TryClaimAsync(tenantId, providerName, eventId, cancellationToken);

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

        _memoryCache.Remove(BuildCacheKey(tenantId, providerName, eventId));

        return Task.CompletedTask;
    }

    private void ConfigureEntry(ICacheEntry entry)
    {
        entry.AbsoluteExpiration = _clock.GetUtcNow().Add(Retention);
        entry.Size = 1;
    }

    internal static string BuildCacheKey(Guid tenantId, string providerName, string eventId) =>
        $"itsm-inbound-webhook-replay:{tenantId:D}:{providerName.Trim().ToLowerInvariant()}:{eventId.Trim()}";
}