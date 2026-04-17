namespace ArchLucid.Core.Billing;

/// <summary>Persistence boundary for subscription rows and webhook idempotency (SQL + InMemory implementations).</summary>
public interface IBillingLedger
{
    Task<bool> TenantHasActiveSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken);

    Task UpsertPendingCheckoutAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSessionId,
        string tierCode,
        int seats,
        int workspaces,
        CancellationToken cancellationToken);

    /// <summary>Inserts webhook dedupe row; returns false when <paramref name="dedupeKey"/> already exists.</summary>
    Task<bool> TryInsertWebhookEventAsync(
        string dedupeKey,
        string provider,
        string eventType,
        string payloadJson,
        CancellationToken cancellationToken);

    Task MarkWebhookProcessedAsync(string dedupeKey, string resultStatus, CancellationToken cancellationToken);

    /// <summary>When webhook insert is duplicate, returns the last <see cref="MarkWebhookProcessedAsync"/> status (e.g. Processed).</summary>
    Task<string?> GetWebhookEventResultStatusAsync(string dedupeKey, CancellationToken cancellationToken);

    Task ActivateSubscriptionAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSubscriptionId,
        string tierCode,
        int seats,
        int workspaces,
        string? rawWebhookJson,
        CancellationToken cancellationToken);

    Task SuspendSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken);

    Task ReinstateSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken);

    Task CancelSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken);
}
