using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Advisory;

public sealed partial class DigestSubscriptionFacade
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<DigestSubscription>> ListByScopeAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return await _subscriptionRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<DigestSubscriptionToggleResult> ToggleAsync(Guid subscriptionId, CancellationToken ct)
    {
        DigestSubscription? subscription = await _subscriptionRepository.GetByIdAsync(subscriptionId, ct).ConfigureAwait(false);

        if (subscription is null)
            return new DigestSubscriptionToggleResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!MatchesScope(subscription, scope))
            return new DigestSubscriptionToggleResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        subscription.IsEnabled = !subscription.IsEnabled;
        await _subscriptionRepository.UpdateAsync(subscription, ct).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.DigestSubscriptionToggled,
                DataJson = JsonSerializer.Serialize(new { subscriptionId, enabled = subscription.IsEnabled }),
            },
            ct).ConfigureAwait(false);

        return new DigestSubscriptionToggleResult
        {
            Outcome = DigestSubscriptionHttpOutcome.Success,
            Subscription = subscription,
        };
    }
}
