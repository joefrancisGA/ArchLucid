namespace ArchLucid.Notifications;

/// <summary>Vendor JSON bodies for Slack and Microsoft Teams <em>incoming</em> webhooks (simple one-way POST).</summary>
public static class ChatOpsIncomingWebhookBodies
{
    /// <summary>Slack incoming webhook: single <c>text</c> field with mrkdwn-style emphasis.</summary>
    public static object ForSlack(ChatOpsWebhookMessage message)
    {
        ArgumentNullException.ThrowIfNull(message);

        string headline = string.IsNullOrWhiteSpace(message.SeverityLabel)
            ? $"*{message.Title}*"
            : FormattableString.Invariant($"*[{message.SeverityLabel!.Trim()}]* {message.Title}");

        string text = CombineBlocks(headline, message.SupportingParagraph, message.Body);

        return new
        {
            text
        };
    }

    /// <summary>
    ///     Slack Block Kit message with Approve and Reject interactive action buttons, for use when an
    ///     <paramref name="approvalRequestId" /> is provided. The action values are encoded as
    ///     <c>governance_approve:{approvalRequestId}</c> and <c>governance_reject:{approvalRequestId}</c>.
    /// </summary>
    public static object ForSlackWithGovernanceActions(ChatOpsWebhookMessage message, string approvalRequestId)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentException.ThrowIfNullOrWhiteSpace(approvalRequestId);

        string headline = string.IsNullOrWhiteSpace(message.SeverityLabel)
            ? $"*{message.Title}*"
            : FormattableString.Invariant($"*[{message.SeverityLabel!.Trim()}]* {message.Title}");

        string body = CombineBlocks(headline, message.SupportingParagraph, message.Body);

        return new
        {
            blocks = new object[]
            {
                new
                {
                    type = "section",
                    text = new { type = "mrkdwn", text = body }
                },
                new
                {
                    type = "actions",
                    elements = new object[]
                    {
                        new
                        {
                            type = "button",
                            text = new { type = "plain_text", text = "Approve", emoji = true },
                            style = "primary",
                            value = $"governance_approve:{approvalRequestId}",
                            action_id = "governance_approve"
                        },
                        new
                        {
                            type = "button",
                            text = new { type = "plain_text", text = "Reject", emoji = true },
                            style = "danger",
                            value = $"governance_reject:{approvalRequestId}",
                            action_id = "governance_reject"
                        }
                    }
                }
            }
        };
    }

    /// <summary>Teams legacy Office 365 Connector incoming webhook expects <c>title</c> and <c>text</c> fields.</summary>
    public static object ForTeams(ChatOpsWebhookMessage message)
    {
        ArgumentNullException.ThrowIfNull(message);

        string title = string.IsNullOrWhiteSpace(message.SeverityLabel)
            ? message.Title
            : FormattableString.Invariant($"[{message.SeverityLabel!.Trim()}] {message.Title}");

        string text =
            TeamsTextBlock(
                string.IsNullOrWhiteSpace(message.SupportingParagraph)
                    ? null
                    : message.SupportingParagraph!.Trim(),
                message.Body.Trim());

        return new
        {
            title,
            text
        };
    }

    private static string CombineBlocks(string paragraphHeadline, string? supporting, string body)
    {
        body = body.Trim();
        paragraphHeadline = paragraphHeadline.Trim();

        return string.IsNullOrWhiteSpace(supporting)
            ? $"{paragraphHeadline}\n\n{body}"
            : $"{paragraphHeadline}\n{supporting.Trim()}\n\n{body}";
    }

    private static string TeamsTextBlock(string? supporting, string body)
    {
        body = body.Trim();

        return string.IsNullOrWhiteSpace(supporting) ? body : $"{supporting.Trim()}\n\n{body}";
    }
}
