using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Notifications;

/// <inheritdoc cref="IAuthorityRunCommittedChatOpsHook"/>
public sealed class AuthorityRunCommittedChatOpsHook(
    IChatOpsWebhookDeliveryService chatOpsWebhookDeliveryService,
    IOptionsMonitor<ChatOpsIncomingWebhooksOptions> incomingWebhooksOptions,
    ILogger<AuthorityRunCommittedChatOpsHook> logger) : IAuthorityRunCommittedChatOpsHook
{
    private readonly IChatOpsWebhookDeliveryService _chatOpsWebhookDeliveryService =
        chatOpsWebhookDeliveryService ?? throw new ArgumentNullException(nameof(chatOpsWebhookDeliveryService));

    private readonly IOptionsMonitor<ChatOpsIncomingWebhooksOptions> _incomingWebhooksOptions =
        incomingWebhooksOptions ?? throw new ArgumentNullException(nameof(incomingWebhooksOptions));

    private readonly ILogger<AuthorityRunCommittedChatOpsHook> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task NotifyAsync(AuthorityRunCommittedChatOpsNotice notice, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(notice);

        ChatOpsIncomingWebhooksOptions options = _incomingWebhooksOptions.CurrentValue;

        ChatOpsWebhookMessage message = BuildMessage(notice);

        WebhookPostOptions telemetry = new()
        {
            EventType = "chatOps.architectureAuthorityRun.completed",
            TenantId = notice.TenantId,
        };

        Task slackTask =
            DeliverIfEnabledAsync(ChatOpsWebhookTarget.Slack,
                enabled: options.SlackNotifyOnAuthorityRunCompleted,
                rawUri: options.SlackIncomingWebhookAbsoluteUri,
                message,
                telemetry,
                cancellationToken);

        Task teamsTask =
            DeliverIfEnabledAsync(ChatOpsWebhookTarget.Teams,
                enabled: options.TeamsNotifyOnAuthorityRunCompleted,
                rawUri: options.TeamsIncomingWebhookAbsoluteUri,
                message,
                telemetry,
                cancellationToken);

        await Task.WhenAll(slackTask, teamsTask).ConfigureAwait(false);
    }

    private async Task DeliverIfEnabledAsync(
        ChatOpsWebhookTarget target,
        bool enabled,
        string? rawUri,
        ChatOpsWebhookMessage message,
        WebhookPostOptions telemetry,
        CancellationToken cancellationToken)
    {
        try
        {
            if (!enabled)
                return;

            string? url = rawUri?.Trim();

            if (string.IsNullOrWhiteSpace(url))
                return;

            if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri) || uri.Scheme != Uri.UriSchemeHttps)
                return;

            await _chatOpsWebhookDeliveryService
                .DeliverAsync(target, url, message, cancellationToken, telemetry)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Authority run ChatOps {Target} webhook delivery failed.", target.ToString());
        }
    }

    private static ChatOpsWebhookMessage BuildMessage(AuthorityRunCommittedChatOpsNotice notice)
    {
        string headline =
            $"Authority run completed ({notice.FindingCount} finding{(notice.FindingCount == 1 ? string.Empty : "s")})";

        string supporting = FormattableString.Invariant($"Run `{notice.RunId:D}`");

        string? detail = notice.Description?.Trim();

        if (string.IsNullOrWhiteSpace(detail))
            detail = "Run finished successfully.";

        return new ChatOpsWebhookMessage
        {
            Title = headline,
            SupportingParagraph = supporting,
            Body = detail!,
        };
    }
}
