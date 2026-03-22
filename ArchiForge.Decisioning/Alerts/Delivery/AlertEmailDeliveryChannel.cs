using ArchiForge.Decisioning.Advisory.Delivery;

namespace ArchiForge.Decisioning.Alerts.Delivery;

public sealed class AlertEmailDeliveryChannel(IEmailSender emailSender) : IAlertDeliveryChannel
{
    public string ChannelType => AlertRoutingChannelType.Email;

    public Task SendAsync(AlertDeliveryPayload payload, CancellationToken ct)
    {
        var subject = $"[{payload.Alert.Severity}] {payload.Alert.Title}";
        var body =
            $"Category: {payload.Alert.Category}{Environment.NewLine}" +
            $"Severity: {payload.Alert.Severity}{Environment.NewLine}" +
            $"Trigger: {payload.Alert.TriggerValue}{Environment.NewLine}{Environment.NewLine}" +
            $"{payload.Alert.Description}";

        return emailSender.SendAsync(
            payload.Subscription.Destination,
            subject,
            body,
            ct);
    }
}
