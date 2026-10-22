namespace ArchLucid.Notifications;

/// <summary>Sends normalized ChatOps messages to Slack or Microsoft Teams incoming webhooks.</summary>
public interface IChatOpsWebhookDeliveryService
{
    /// <summary>
    ///     Builds the vendor-specific JSON envelope and delegates to <see cref="IWebhookPoster" /> (<c>application/json</c>
    ///     POST).
    /// </summary>
    Task DeliverAsync(
        ChatOpsWebhookTarget target,
        string webhookAbsoluteUri,
        ChatOpsWebhookMessage message,
        CancellationToken cancellationToken,
        WebhookPostOptions? webhookPostOptions = null);
}
