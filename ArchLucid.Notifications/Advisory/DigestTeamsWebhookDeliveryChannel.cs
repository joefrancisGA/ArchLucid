using System.Net;

using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Notifications.Advisory;

/// <summary>Delivers an architecture digest to a Microsoft Teams channel via an incoming webhook.</summary>
public sealed class DigestTeamsWebhookDeliveryChannel(IChatOpsWebhookDeliveryService chatOpsWebhookDelivery)
    : IDigestDeliveryChannel
{
    private readonly IChatOpsWebhookDeliveryService _chatOpsWebhookDelivery =
        chatOpsWebhookDelivery ?? throw new ArgumentNullException(nameof(chatOpsWebhookDelivery));

    /// <inheritdoc />
    public string ChannelType => DigestDeliveryChannelType.TeamsWebhook;

    /// <inheritdoc />
    public Task SendAsync(DigestDeliveryPayload payload, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        ChatOpsWebhookMessage body = new()
        {
            Title = payload.Digest.Title,
            SupportingParagraph = WebUtility.HtmlEncode(payload.Digest.Summary),
            Body = payload.Digest.ContentMarkdown,
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
