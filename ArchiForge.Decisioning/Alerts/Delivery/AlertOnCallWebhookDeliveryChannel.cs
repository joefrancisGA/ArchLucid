using ArchiForge.Decisioning.Advisory.Delivery;

namespace ArchiForge.Decisioning.Alerts.Delivery;

public sealed class AlertOnCallWebhookDeliveryChannel(IWebhookPoster webhookPoster) : IAlertDeliveryChannel
{
    public string ChannelType => AlertRoutingChannelType.OnCallWebhook;

    public Task SendAsync(AlertDeliveryPayload payload, CancellationToken ct)
    {
        var body = new
        {
            severity = payload.Alert.Severity,
            title = payload.Alert.Title,
            category = payload.Alert.Category,
            triggerValue = payload.Alert.TriggerValue,
            description = payload.Alert.Description,
            alertId = payload.Alert.AlertId,
            runId = payload.Alert.RunId,
        };

        return webhookPoster.PostJsonAsync(
            payload.Subscription.Destination,
            body,
            ct);
    }
}
