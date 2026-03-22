namespace ArchiForge.Decisioning.Alerts.Delivery;

public interface IAlertDeliveryAttemptRepository
{
    Task CreateAsync(AlertDeliveryAttempt attempt, CancellationToken ct);
    Task UpdateAsync(AlertDeliveryAttempt attempt, CancellationToken ct);

    Task<IReadOnlyList<AlertDeliveryAttempt>> ListByAlertAsync(
        Guid alertId,
        CancellationToken ct);

    Task<IReadOnlyList<AlertDeliveryAttempt>> ListBySubscriptionAsync(
        Guid routingSubscriptionId,
        int take,
        CancellationToken ct);
}
