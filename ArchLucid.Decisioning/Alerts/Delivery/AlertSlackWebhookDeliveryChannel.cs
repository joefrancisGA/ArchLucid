using ArchLucid.Notifications;

namespace ArchLucid.Decisioning.Alerts.Delivery;

/// <summary>
///     Posts a simple <c>text</c> payload to a Slack incoming webhook (<see cref="AlertRoutingChannelType.SlackWebhook" />
///     ).
/// </summary>
/// <param name="chatOpsWebhookDelivery"><see cref="IChatOpsWebhookDeliveryService" /> (shared Slack/Teams JSON shapes).</param>
public sealed class AlertSlackWebhookDeliveryChannel(IChatOpsWebhookDeliveryService chatOpsWebhookDelivery) : IAlertDeliveryChannel
{
    private readonly IChatOpsWebhookDeliveryService _chatOpsWebhookDelivery =
        chatOpsWebhookDelivery ?? throw new ArgumentNullException(nameof(chatOpsWebhookDelivery));

    /// <inheritdoc />
    public string ChannelType => AlertRoutingChannelType.SlackWebhook;

    /// <inheritdoc />
    public Task SendAsync(AlertDeliveryPayload payload, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        ChatOpsWebhookMessage body = new()
        {
            SeverityLabel = payload.Alert.Severity,
            Title = payload.Alert.Title,
            SupportingParagraph =
                $"Category: {payload.Alert.Category}\nTrigger: {payload.Alert.TriggerValue}",
            Body = payload.Alert.Description,
        };

        return _chatOpsWebhookDelivery.DeliverAsync(
            ChatOpsWebhookTarget.Slack,
            payload.Subscription.Destination,
            body,
            ct);
    }
}
