using System.Collections.Concurrent;

using ArchLucid.Core.Integration;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>Process-lifetime claim store for explicit InMemory storage.</summary>
public sealed class InMemoryAzureDevOpsThreadCreateClaimStore : IAzureDevOpsThreadCreateClaimStore
{
    private readonly ConcurrentDictionary<AzureDevOpsThreadCreateClaim, byte> _claims = new();

    public Task<bool> TryClaimAsync(AzureDevOpsThreadCreateClaim claim, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(_claims.TryAdd(claim, 0));
    }
}
