using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Notifications.Advisory;

/// <summary>Delivers an architecture digest to a Slack channel via an incoming webhook.</summary>
public sealed class DigestSlackWebhookDeliveryChannel(IChatOpsWebhookDeliveryService chatOpsWebhookDelivery)
    : IDigestDeliveryChannel
{
    private readonly IChatOpsWebhookDeliveryService _chatOpsWebhookDelivery =
        chatOpsWebhookDelivery ?? throw new ArgumentNullException(nameof(chatOpsWebhookDelivery));

    /// <inheritdoc />
    public string ChannelType => DigestDeliveryChannelType.SlackWebhook;

    /// <inheritdoc />
    public Task SendAsync(DigestDeliveryPayload payload, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        ChatOpsWebhookMessage body = new()
        {
            Title = payload.Digest.Title,
            SupportingParagraph = payload.Digest.Summary,
            Body = payload.Digest.ContentMarkdown,
        };

        return _chatOpsWebhookDelivery.DeliverAsync(
            ChatOpsWebhookTarget.Slack,
            payload.Subscription.Destination,
            body,
            ct);
    }
}
