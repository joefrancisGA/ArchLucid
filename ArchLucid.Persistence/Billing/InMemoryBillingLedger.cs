using System.Collections.Concurrent;

using ArchLucid.Core.Billing;

namespace ArchLucid.Persistence.Billing;

public sealed class InMemoryBillingLedger : IBillingLedger
{
    private readonly ConcurrentDictionary<Guid, BillingSubscriptionRow> _subscriptions = new();

    private readonly ConcurrentDictionary<string, string> _webhookStatuses = new();

    private readonly List<BillingSubscriptionStateHistoryEntry> _stateHistory = [];

    private readonly Lock _historyGate = new();

    public Task<bool> TenantHasActiveSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return Task.FromResult(
            _subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row)
            && BillingLedgerCore.IsActiveStatus(row.Status));
    }

    public Task UpsertPendingCheckoutAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSessionId,
        string tierCode,
        int seats,
        int workspaces,
        CancellationToken cancellationToken)
    {
        _ = _subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? previous);
        BillingSubscriptionRow next = BillingLedgerCore.CreatePendingCheckout(
            tenantId,
            workspaceId,
            projectId,
            provider,
            providerSessionId,
            tierCode,
            seats,
            workspaces);

        _subscriptions[tenantId] = next;
        RecordStateChange("UpsertPending", previous, next);

        return Task.CompletedTask;
    }

    public Task<bool> TryInsertWebhookEventAsync(
        string dedupeKey,
        string provider,
        string eventType,
        string payloadJson,
        CancellationToken cancellationToken)
    {
        bool added = _webhookStatuses.TryAdd(dedupeKey, BillingLedgerCore.WebhookStatusReceived);

        return Task.FromResult(added);
    }

    public Task MarkWebhookProcessedAsync(string dedupeKey, string resultStatus, CancellationToken cancellationToken)
    {
        _webhookStatuses[dedupeKey] = resultStatus;

        return Task.CompletedTask;
    }

    public Task<string?> GetWebhookEventResultStatusAsync(string dedupeKey, CancellationToken cancellationToken)
    {
        return _webhookStatuses.TryGetValue(dedupeKey, out string? status)
            ? Task.FromResult<string?>(status)
            : Task.FromResult<string?>(null);
    }

    public Task ActivateSubscriptionAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSubscriptionId,
        string tierCode,
        int seats,
        int workspaces,
        string? rawWebhookJson,
        CancellationToken cancellationToken)
    {
        _ = _subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? previous);
        BillingSubscriptionRow next = BillingLedgerCore.CreateActiveSubscription(
            tenantId,
            workspaceId,
            projectId,
            provider,
            providerSubscriptionId,
            tierCode,
            seats,
            workspaces);

        _subscriptions[tenantId] = next;
        RecordStateChange("Activate", previous, next);

        return Task.CompletedTask;
    }

    public Task SuspendSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (!_subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row))
            return Task.CompletedTask;

        BillingSubscriptionRow next = BillingLedgerCore.WithStatus(row, BillingLedgerCore.StatusSuspended);
        _subscriptions[tenantId] = next;
        RecordStateChange("Suspend", row, next);

        return Task.CompletedTask;
    }

    public Task ReinstateSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (!_subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row))
            return Task.CompletedTask;

        BillingSubscriptionRow next = BillingLedgerCore.WithStatus(row, BillingLedgerCore.StatusActive);
        _subscriptions[tenantId] = next;
        RecordStateChange("Reinstate", row, next);

        return Task.CompletedTask;
    }

    public Task CancelSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (!_subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row))
            return Task.CompletedTask;

        BillingSubscriptionRow next = BillingLedgerCore.WithStatus(row, BillingLedgerCore.StatusCanceled);
        _subscriptions[tenantId] = next;
        RecordStateChange("Cancel", row, next);

        return Task.CompletedTask;
    }

    public Task ChangePlanAsync(Guid tenantId, string tierCode, string? rawWebhookJson,
        CancellationToken cancellationToken)
    {
        if (!_subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row))
            return Task.CompletedTask;

        BillingSubscriptionRow next = BillingLedgerCore.WithTier(row, tierCode);
        _subscriptions[tenantId] = next;
        RecordStateChange("ChangePlan", row, next);

        return Task.CompletedTask;
    }

    public Task ChangeQuantityAsync(Guid tenantId, int seatsPurchased, string? rawWebhookJson,
        CancellationToken cancellationToken)
    {
        if (!_subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row))
            return Task.CompletedTask;

        BillingSubscriptionRow next = BillingLedgerCore.WithSeats(row, seatsPurchased);
        _subscriptions[tenantId] = next;
        RecordStateChange("ChangeQuantity", row, next);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<BillingSubscriptionStateHistoryEntry>> GetSubscriptionStateHistoryAsync(
        Guid tenantId,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        BillingLedgerCore.ValidateHistoryMaxRows(maxRows);

        lock (_historyGate)
        {
            IReadOnlyList<BillingSubscriptionStateHistoryEntry> page =
                BillingLedgerCore.SelectTenantHistory(_stateHistory, tenantId, maxRows);

            return Task.FromResult(page);
        }
    }

    public Task<BillingSubscriptionSnapshot?> TryGetSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (!_subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row))
            return Task.FromResult<BillingSubscriptionSnapshot?>(null);

        return Task.FromResult<BillingSubscriptionSnapshot?>(BillingLedgerCore.ToSnapshot(row));
    }

    public Task<string?> TryGetProviderSubscriptionIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (!_subscriptions.TryGetValue(tenantId, out BillingSubscriptionRow? row))
            return Task.FromResult<string?>(null);

        return Task.FromResult<string?>(row.ProviderSubscriptionId);
    }

    public Task<Guid?> TryResolveTenantIdByProviderSubscriptionIdAsync(
        string providerSubscriptionId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(providerSubscriptionId))
            return Task.FromResult<Guid?>(null);

        foreach (KeyValuePair<Guid, BillingSubscriptionRow> pair in _subscriptions)
        {
            if (BillingLedgerCore.MatchesProviderSubscriptionId(pair.Value, providerSubscriptionId))
                return Task.FromResult<Guid?>(pair.Key);
        }

        return Task.FromResult<Guid?>(null);
    }

    private void RecordStateChange(string changeKind, BillingSubscriptionRow? previous, BillingSubscriptionRow next)
    {
        lock (_historyGate)
        {
            _stateHistory.Add(
                BillingLedgerCore.CreateStateHistoryEntry(
                    changeKind,
                    previous,
                    next,
                    TimeProvider.System.GetUtcNow()));
        }
    }
}
