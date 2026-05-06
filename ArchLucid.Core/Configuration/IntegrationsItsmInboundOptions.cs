namespace ArchLucid.Core.Configuration;

/// <summary>Inbound ITSM webhook shared secrets (see <c>Integrations:ItsmInbound</c>).</summary>
public sealed class IntegrationsItsmInboundOptions
{
    public const string SectionName = "Integrations:ItsmInbound";

    /// <summary>Shared secret for <c>X-Jira-Token</c> header on Jira webhook POST. Empty disables the endpoint.</summary>
    public string JiraWebhookSecret
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Shared secret for <c>X-ServiceNow-Token</c> header. Empty disables the endpoint.</summary>
    public string ServiceNowWebhookSecret
    {
        get;
        set;
    } = string.Empty;
}
