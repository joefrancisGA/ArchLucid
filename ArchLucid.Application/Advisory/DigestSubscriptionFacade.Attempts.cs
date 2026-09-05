using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Advisory;

public sealed partial class DigestSubscriptionFacade
{
    /// <inheritdoc />
    public async Task<DigestSubscriptionAttemptsResult> ListAttemptsBySubscriptionAsync(
        Guid subscriptionId,
        int take,
        CancellationToken ct)
    {
        DigestSubscription? subscription = await _subscriptionRepository.GetByIdAsync(subscriptionId, ct).ConfigureAwait(false);

        if (subscription is null)
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!MatchesScope(subscription, scope))
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        IReadOnlyList<DigestDeliveryAttempt> attempts = await _attemptRepository.ListBySubscriptionAsync(
            subscriptionId,
            Math.Clamp(take, 1, PaginationDefaults.MaxPageSize),
            ct).ConfigureAwait(false);

        return new DigestSubscriptionAttemptsResult
        {
            Outcome = DigestSubscriptionHttpOutcome.Success,
            Attempts = attempts,
        };
    }

    /// <inheritdoc />
    public async Task<DigestSubscriptionAttemptsResult> ListAttemptsByDigestAsync(Guid digestId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        ArchitectureDigest? digest = await _digestRepository.GetByIdAsync(digestId, ct).ConfigureAwait(false);

        if (digest is null)
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        if (digest.TenantId != scope.TenantId ||
            digest.WorkspaceId != scope.WorkspaceId ||
            digest.ProjectId != scope.ProjectId)
        {
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };
        }

        IReadOnlyList<DigestDeliveryAttempt> attempts =
            await _attemptRepository.ListByDigestAsync(digestId, ct).ConfigureAwait(false);

        return new DigestSubscriptionAttemptsResult
        {
            Outcome = DigestSubscriptionHttpOutcome.Success,
            Attempts = attempts,
        };
    }

    /// <inheritdoc />
    public async Task<(DigestSubscriptionHttpOutcome Outcome, DigestDeliveryAttemptsBatchDto? Batch, string? Message)>
        ListAttemptsByDigestIdsAsync(IReadOnlyList<Guid> digestIds, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<DigestDeliveryAttempt> attempts = await _attemptRepository.ListByDigestIdsAsync(
            digestIds,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct).ConfigureAwait(false);

        Dictionary<Guid, List<DigestDeliveryAttempt>> byDigest = attempts
            .GroupBy(a => a.DigestId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.AttemptedUtc).ToList());

        List<DigestDeliveryAttemptsForDigestDto> items = [];

        foreach (Guid digestId in digestIds.Distinct())
        {
            List<DigestDeliveryAttempt> forDigest =
                byDigest.TryGetValue(digestId, out List<DigestDeliveryAttempt>? list)
                    ? list
                    : [];

            items.Add(new DigestDeliveryAttemptsForDigestDto
            {
                DigestId = digestId,
                Attempts = forDigest,
            });
        }

        return (
            DigestSubscriptionHttpOutcome.Success,
            new DigestDeliveryAttemptsBatchDto { Items = items },
            null);
    }
}
