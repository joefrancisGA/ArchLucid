namespace ArchiForge.Decisioning.Alerts.Delivery;

public interface IAlertDeliveryDispatcher
{
    Task DeliverAsync(AlertRecord alert, CancellationToken ct);
}
