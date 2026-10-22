using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="DigestDeliveryAttempt" /> rows.</summary>
public interface IDigestDeliveryAttemptRepository
{
    Task CreateAsync(DigestDeliveryAttempt attempt, CancellationToken ct);

    Task UpdateAsync(DigestDeliveryAttempt attempt, CancellationToken ct);

    Task<IReadOnlyList<DigestDeliveryAttempt>> ListByDigestAsync(
        ScopeContext scope,
        Guid digestId,
        CancellationToken ct);

    /// <summary>
    ///     Returns delivery attempts for many digests in one round-trip (per-digest cap matches
    ///     <see cref="ListByDigestAsync" />). Filtered to the caller scope triple.
    /// </summary>
    Task<IReadOnlyList<DigestDeliveryAttempt>> ListByDigestIdsAsync(
        IReadOnlyCollection<Guid> digestIds,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<IReadOnlyList<DigestDeliveryAttempt>> ListBySubscriptionAsync(
        ScopeContext scope,
        Guid subscriptionId,
        int take,
        CancellationToken ct);
}
