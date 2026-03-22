namespace ArchiForge.Decisioning.Alerts.Delivery;

public interface IAlertDeliveryChannel
{
    string ChannelType { get; }

    Task SendAsync(
        AlertDeliveryPayload payload,
        CancellationToken ct);
}
