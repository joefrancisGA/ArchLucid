using System.Collections.Concurrent;

using ArchLucid.Core.Integration;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>Process-local reservation store used only for explicit InMemory storage.</summary>
public sealed class InMemoryOutboundWebhookDispatchClaimStore : IOutboundWebhookDispatchClaimStore
{
    private readonly ConcurrentDictionary<OutboundWebhookDispatchClaim, byte> _claims = new();

    public Task<bool> TryClaimAsync(OutboundWebhookDispatchClaim claim, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(_claims.TryAdd(claim, 0));
    }
}
