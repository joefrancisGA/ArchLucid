using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>CRUD and scoped listing for <see cref="DigestSubscription" /> rows.</summary>
public interface IDigestSubscriptionRepository
{
    Task CreateAsync(DigestSubscription subscription, CancellationToken ct);

    Task UpdateAsync(DigestSubscription subscription, CancellationToken ct);

    /// <summary>Records a successful delivery without changing the subscription's routing settings.</summary>
    Task RecordDeliveryAsync(DigestSubscription subscription, DateTime deliveredUtc, CancellationToken ct);

    Task<DigestSubscription?> GetByIdAsync(ScopeContext scope, Guid subscriptionId, CancellationToken ct);

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
