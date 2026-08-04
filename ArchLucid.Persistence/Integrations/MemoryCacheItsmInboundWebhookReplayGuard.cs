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
    public Task RememberAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        MemoryCacheEntryOptions entryOptions = new()
        {
            AbsoluteExpiration = _clock.GetUtcNow().Add(Retention),
            Size = 1,
        };

        // GetOrCreate avoids a check-then-set race under concurrent duplicate deliveries.
        _ = _memoryCache.GetOrCreate(
            BuildCacheKey(tenantId, providerName, eventId),
            entry =>
            {
                entry.AbsoluteExpiration = entryOptions.AbsoluteExpiration;
                entry.Size = entryOptions.Size;

                return true;
            });

        return Task.CompletedTask;
    }

    internal static string BuildCacheKey(Guid tenantId, string providerName, string eventId) =>
        $"itsm-inbound-webhook-replay:{tenantId:D}:{providerName.Trim().ToLowerInvariant()}:{eventId.Trim()}";
}
