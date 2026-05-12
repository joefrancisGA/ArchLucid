namespace ArchLucid.Notifications;

/// <inheritdoc cref="IChatOpsWebhookDeliveryService" />
public sealed class ChatOpsWebhookDeliveryService(IWebhookPoster webhookPoster) : IChatOpsWebhookDeliveryService
{
    private readonly IWebhookPoster _webhookPoster =
        webhookPoster ?? throw new ArgumentNullException(nameof(webhookPoster));

    /// <inheritdoc />
    public Task DeliverAsync(
        ChatOpsWebhookTarget target,
        string webhookAbsoluteUri,
        ChatOpsWebhookMessage message,
        CancellationToken cancellationToken,
        WebhookPostOptions? webhookPostOptions = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(webhookAbsoluteUri);
        ArgumentNullException.ThrowIfNull(message);

        object body = BuildBody(target, message);

        return _webhookPoster.PostJsonAsync(
            webhookAbsoluteUri,
            body,
            cancellationToken,
            webhookPostOptions);
    }

    private static object BuildBody(ChatOpsWebhookTarget target, ChatOpsWebhookMessage message)
    {
        if (target is ChatOpsWebhookTarget.Slack)
            return ChatOpsIncomingWebhookBodies.ForSlack(message);

        return target is ChatOpsWebhookTarget.Teams ? ChatOpsIncomingWebhookBodies.ForTeams(message) : throw new ArgumentOutOfRangeException(nameof(target));
    }
}
