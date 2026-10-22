using System.Net;

using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Notifications.Alerts;

/// <summary>
///     Posts JSON with <c>title</c> and <c>text</c> to a Microsoft Teams incoming webhook (
///     <see cref="AlertRoutingChannelType.TeamsWebhook" />).
/// </summary>
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
                $"Category: {WebUtility.HtmlEncode(payload.Alert.Category)}\nTrigger: {WebUtility.HtmlEncode(payload.Alert.TriggerValue)}",
            Body = WebUtility.HtmlEncode(payload.Alert.Description ?? string.Empty),
        };

        string destination = ChatOpsWebhookAbsoluteUriValidator.ResolveHttpsDeliveryUriOrThrow(
            payload.Subscription.Destination,
            nameof(payload.Subscription.Destination));

        return _chatOpsWebhookDelivery.DeliverAsync(
            ChatOpsWebhookTarget.Teams,
            destination,
            body,
            ct);
    }
}
