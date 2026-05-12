using ArchLucid.Notifications;

namespace ArchLucid.Decisioning.Alerts.Delivery;

/// <summary>
///     Posts JSON with <c>title</c> and <c>text</c> to a Microsoft Teams incoming webhook (
///     <see cref="AlertRoutingChannelType.TeamsWebhook" />).
/// </summary>
/// <param name="chatOpsWebhookDelivery"><see cref="IChatOpsWebhookDeliveryService" />.</param>
public sealed class AlertTeamsWebhookDeliveryChannel(IChatOpsWebhookDeliveryService chatOpsWebhookDelivery) :
    IAlertDeliveryChannel
{
    private readonly IChatOpsWebhookDeliveryService _chatOpsWebhookDelivery =
        chatOpsWebhookDelivery ?? throw new ArgumentNullException(nameof(chatOpsWebhookDelivery));

    /// <inheritdoc />
    public string ChannelType => AlertRoutingChannelType.TeamsWebhook;

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
            ChatOpsWebhookTarget.Teams,
            payload.Subscription.Destination,
            body,
            ct);
    }
}
