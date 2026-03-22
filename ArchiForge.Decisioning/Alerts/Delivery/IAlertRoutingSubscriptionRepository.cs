namespace ArchiForge.Decisioning.Alerts.Delivery;

public interface IAlertRoutingSubscriptionRepository
{
    Task CreateAsync(AlertRoutingSubscription subscription, CancellationToken ct);
    Task UpdateAsync(AlertRoutingSubscription subscription, CancellationToken ct);
    Task<AlertRoutingSubscription?> GetByIdAsync(Guid routingSubscriptionId, CancellationToken ct);

    Task<IReadOnlyList<AlertRoutingSubscription>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<IReadOnlyList<AlertRoutingSubscription>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
