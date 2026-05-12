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

        return new { text };
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

        return new { title, text };
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

        if (string.IsNullOrWhiteSpace(supporting))
            return body;

        return $"{supporting.Trim()}\n\n{body}";
    }
}
