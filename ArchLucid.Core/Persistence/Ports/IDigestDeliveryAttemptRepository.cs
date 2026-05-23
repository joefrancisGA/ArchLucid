using ArchLucid.Contracts.Advisory.Delivery;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="DigestDeliveryAttempt" /> rows.</summary>
public interface IDigestDeliveryAttemptRepository
{
    Task CreateAsync(DigestDeliveryAttempt attempt, CancellationToken ct);

    Task UpdateAsync(DigestDeliveryAttempt attempt, CancellationToken ct);

    Task<IReadOnlyList<DigestDeliveryAttempt>> ListByDigestAsync(
        Guid digestId,
        CancellationToken ct);

    Task<IReadOnlyList<DigestDeliveryAttempt>> ListBySubscriptionAsync(
        Guid subscriptionId,
        int take,
        CancellationToken ct);
}
