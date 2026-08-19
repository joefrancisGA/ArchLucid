namespace ArchLucid.Notifications;

/// <summary>
///     Canonical text fields for Slack incoming webhooks (<c>{ "text": "..." }</c>) and Teams connector cards (<c>title</c> +
///     <c>text</c>).
/// </summary>
public sealed class ChatOpsWebhookMessage
{
    /// <summary>Optional label such as alert severity (<c>[Critical]</c> in Teams,<c>*[Critical]*</c> in Slack).</summary>
    public string? SeverityLabel
    {
        get;
        init;
    }

    public required string Title
    {
        get;
        init;
    }

    /// <summary>Intermediate block (digest summary, metric lines, categories) placed between headline and body.</summary>
    public string? SupportingParagraph
    {
        get;
        init;
    }

    public required string Body
    {
        get;
        init;
    }
}
