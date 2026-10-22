using System.Net;

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
            CorrelationId = notice.RunId.ToString("D"),
        };

        bool slackAttempted = false;
        bool slackSucceeded = false;
        bool teamsAttempted = false;
        bool teamsSucceeded = false;

        Task slackTask =
            DeliverIfEnabledAsync(
                ChatOpsWebhookTarget.Slack,
                enabled: options.SlackNotifyOnAuthorityRunCompleted,
                rawUri: options.SlackIncomingWebhookAbsoluteUri,
                message,
                telemetry,
                attempted => slackAttempted = attempted,
                succeeded => slackSucceeded = succeeded,
                cancellationToken);

        Task teamsTask =
            DeliverIfEnabledAsync(
                ChatOpsWebhookTarget.Teams,
                enabled: options.TeamsNotifyOnAuthorityRunCompleted,
                rawUri: options.TeamsIncomingWebhookAbsoluteUri,
                message,
                telemetry,
                attempted => teamsAttempted = attempted,
                succeeded => teamsSucceeded = succeeded,
                cancellationToken);

        await Task.WhenAll(slackTask, teamsTask).ConfigureAwait(false);

        if ((slackAttempted && !slackSucceeded && (!teamsAttempted || !teamsSucceeded))
            || (teamsAttempted && !teamsSucceeded && (!slackAttempted || !slackSucceeded)))
        {
            throw new InvalidOperationException("ChatOps webhook delivery failed for all enabled targets.");
        }
    }

    private async Task DeliverIfEnabledAsync(
        ChatOpsWebhookTarget target,
        bool enabled,
        string? rawUri,
        ChatOpsWebhookMessage message,
        WebhookPostOptions telemetry,
        Action<bool> markAttempted,
        Action<bool> markSucceeded,
        CancellationToken cancellationToken)
    {
        if (!enabled)
            return;

        if (!ChatOpsWebhookAbsoluteUriValidator.TryValidateHttpsAbsoluteUri(rawUri, out string deliveryUri))
            return;

        markAttempted(true);

        try
        {
            ChatOpsWebhookMessage deliveryMessage = AdaptMessageForTarget(target, message);

            await _chatOpsWebhookDeliveryService
                .DeliverAsync(target, deliveryUri, deliveryMessage, cancellationToken, telemetry)
                .ConfigureAwait(false);

            markSucceeded(true);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Authority run ChatOps {Target} webhook delivery failed.", target.ToString());
            markSucceeded(false);
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

    private static ChatOpsWebhookMessage AdaptMessageForTarget(ChatOpsWebhookTarget target, ChatOpsWebhookMessage message)
    {
        if (target is ChatOpsWebhookTarget.Slack)
        {
            return new ChatOpsWebhookMessage
            {
                Title = message.Title,
                SupportingParagraph = message.SupportingParagraph,
                Body = ChatOpsSlackMrkdwnEscaper.EscapeFormattingMetacharacters(message.Body),
                SeverityLabel = message.SeverityLabel,
            };
        }

        if (target is ChatOpsWebhookTarget.Teams)
        {
            return new ChatOpsWebhookMessage
            {
                Title = message.Title,
                SupportingParagraph = string.IsNullOrWhiteSpace(message.SupportingParagraph)
                    ? message.SupportingParagraph
                    : WebUtility.HtmlEncode(message.SupportingParagraph),
                Body = WebUtility.HtmlEncode(message.Body),
                SeverityLabel = message.SeverityLabel,
            };
        }

        throw new ArgumentOutOfRangeException(nameof(target));
    }
}
