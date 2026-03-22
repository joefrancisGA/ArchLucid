using ArchiForge.Decisioning.Advisory.Delivery;

namespace ArchiForge.Decisioning.Alerts.Delivery;

public sealed class AlertSlackWebhookDeliveryChannel(IWebhookPoster webhookPoster) : IAlertDeliveryChannel
{
    public string ChannelType => AlertRoutingChannelType.SlackWebhook;

    public Task SendAsync(AlertDeliveryPayload payload, CancellationToken ct)
    {
        var body = new
        {
            text =
                $"*[{payload.Alert.Severity}]* {payload.Alert.Title}\n" +
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
