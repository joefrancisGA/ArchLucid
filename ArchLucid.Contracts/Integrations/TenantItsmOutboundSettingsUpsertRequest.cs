namespace ArchLucid.Contracts.Integrations;

/// <summary>Upsert optional per-tenant ITSM outbound overrides (System Administration onboarding wizard).</summary>
public sealed class TenantItsmOutboundSettingsUpsertRequest
{
    public string? JiraProjectKeyOverride
    {
        get;
        init;
    }

    public bool? JiraSendInfoSeverity
    {
        get;
        init;
    }

    public string? JiraIssueTypeBySeverityJson
    {
        get;
        init;
    }

    public bool? ServiceNowAutoCreateCmdbCi
    {
        get;
        init;
    }
}
