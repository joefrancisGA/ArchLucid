using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Advisory;

/// <summary>
///     HTTP-facing facade for digest subscription routes previously in <c>DigestSubscriptionsController</c>.
/// </summary>
public interface IDigestSubscriptionFacade
{
    Task<DigestSubscriptionCreateResult> CreateAsync(DigestSubscription subscription, CancellationToken ct);

    Task<IReadOnlyList<DigestSubscription>> ListByScopeAsync(CancellationToken ct);

    Task<DigestSubscriptionToggleResult> ToggleAsync(Guid subscriptionId, CancellationToken ct);

    Task<DigestSubscriptionAttemptsResult> ListAttemptsBySubscriptionAsync(
        Guid subscriptionId,
        int take,
        CancellationToken ct);

    Task<DigestSubscriptionAttemptsResult> ListAttemptsByDigestAsync(Guid digestId, CancellationToken ct);

    Task<(DigestSubscriptionHttpOutcome Outcome, DigestDeliveryAttemptsBatchDto? Batch, string? Message)> ListAttemptsByDigestIdsAsync(
        IReadOnlyList<Guid> digestIds,
        CancellationToken ct);
}
