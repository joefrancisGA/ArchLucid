using ArchiForge.Decisioning.Advisory.Delivery;

namespace ArchiForge.Decisioning.Alerts.Delivery;

public sealed class AlertTeamsWebhookDeliveryChannel(IWebhookPoster webhookPoster) : IAlertDeliveryChannel
{
    public string ChannelType => AlertRoutingChannelType.TeamsWebhook;

    public Task SendAsync(AlertDeliveryPayload payload, CancellationToken ct)
    {
        var body = new
        {
            title = $"[{payload.Alert.Severity}] {payload.Alert.Title}",
            text =
                $"Category: {payload.Alert.Category}\n" +
                $"Trigger: {payload.Alert.TriggerValue}\n\n" +
                $"{payload.Alert.Description}",
        };

        return webhookPoster.PostJsonAsync(
            payload.Subscription.Destination,
            body,
            ct);
    }
}
