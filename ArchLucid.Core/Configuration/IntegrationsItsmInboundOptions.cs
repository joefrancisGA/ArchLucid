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

    /// <summary>
    ///     Optional per-deployment map: Jira workflow status <c>name</c> →
    ///     <see cref="ArchLucid.Contracts.Findings.FindingHumanReviewStatus"/> name (e.g. <c>Approved</c>). Keys match case-insensitively;
    ///     when a status is absent here, built-in defaults apply.
    /// </summary>
    public Dictionary<string, string> JiraStatusHumanReviewMap { get; set; } = new();

    /// <summary>
    ///     Optional per-deployment map: ServiceNow <c>state</c> / <c>incident_state</c> raw value (string or numeric text) →
    ///     <see cref="ArchLucid.Contracts.Findings.FindingHumanReviewStatus"/> name. Keys match case-insensitively; built-in defaults apply for unmapped values.
    /// </summary>
    public Dictionary<string, string> ServiceNowStateHumanReviewMap { get; set; } = new();

    /// <summary>
    ///     When <see langword="true" />, callers must send <c>X-ArchLucid-Signature</c> = lowercase hex HMAC-SHA256(body bytes,
    ///     UTF-8 shared secret). The legacy bearer token header is still required.
    /// </summary>
    public bool RequireBodyHmacSignature { get; set; }

    /// <summary>Maximum acceptable |now − payload| skew when <c>X-ArchLucid-Timestamp</c> (Unix seconds) is present.</summary>
    public int WebhookTimestampSkewSeconds { get; set; } = 300;
}
