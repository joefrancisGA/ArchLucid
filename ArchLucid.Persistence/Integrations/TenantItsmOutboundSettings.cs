namespace ArchLucid.Persistence.Integrations;

/// <summary>Optional per-tenant overrides for first-party outbound ITSM create (see <c>dbo.TenantItsmOutboundSettings</c>).</summary>
public sealed class TenantItsmOutboundSettings
{
    public string? JiraProjectKeyOverride { get; init; }

    /// <summary>When <see langword="true"/>, informational findings may create a Jira issue at Low priority.</summary>
    public bool JiraSendInfoSeverity { get; init; }

    /// <summary>Optional JSON map of finding severity name → Jira issue type name (e.g. <c>Critical</c> → <c>Bug</c>).</summary>
    public string? JiraIssueTypeBySeverityJson { get; init; }

    /// <summary>When <see langword="true"/>, create <c>cmdb_ci_appl</c> if name lookup finds no row (ServiceNow only).</summary>
    public bool ServiceNowAutoCreateCmdbCi { get; init; }
}
