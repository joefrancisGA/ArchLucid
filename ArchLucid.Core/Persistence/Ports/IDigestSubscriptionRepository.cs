using ArchLucid.Contracts.Advisory.Delivery;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>CRUD and scoped listing for <see cref="DigestSubscription" /> rows.</summary>
public interface IDigestSubscriptionRepository
{
    Task CreateAsync(DigestSubscription subscription, CancellationToken ct);

    Task UpdateAsync(DigestSubscription subscription, CancellationToken ct);

    Task<DigestSubscription?> GetByIdAsync(Guid subscriptionId, CancellationToken ct);

    Task<IReadOnlyList<DigestSubscription>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<IReadOnlyList<DigestSubscription>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
