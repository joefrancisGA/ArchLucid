namespace ArchLucid.Notifications;

/// <summary>
///     Optional Slack / Teams incoming webhook destinations for lifecycle ChatOps notices. Prefer Azure Key Vault
///     references (or encrypted tenant-side storage) rather than plaintext URLs for production.
/// </summary>
/// <seealso cref="AuthorityRunCommittedChatOpsHook"/>
public sealed class ChatOpsIncomingWebhooksOptions
{
    public const string SectionName = "ChatOpsIncomingWebhooks";

    /// <summary>
    ///     When true together with <see cref="SlackIncomingWebhookAbsoluteUri"/>, notifies Slack after a committed authority
    ///     run completes.
    /// </summary>
    public bool SlackNotifyOnAuthorityRunCompleted
    {
        get;
        set;
    }

    /// <summary>HTTPS incoming webhook URL (Slack).</summary>
    public string? SlackIncomingWebhookAbsoluteUri
    {
        get;
        set;
    }

    /// <summary>
    ///     When true together with <see cref="TeamsIncomingWebhookAbsoluteUri"/>, notifies Teams after a committed
    ///     authority run completes.
    /// </summary>
    public bool TeamsNotifyOnAuthorityRunCompleted
    {
        get;
        set;
    }

    /// <summary>HTTPS incoming webhook URL (Microsoft Teams connector).</summary>
    public string? TeamsIncomingWebhookAbsoluteUri
    {
        get;
        set;
    }
}
