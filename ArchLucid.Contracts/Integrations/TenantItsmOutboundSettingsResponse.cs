namespace ArchLucid.Contracts.Integrations;

/// <summary>Per-tenant ITSM outbound overrides plus masked deployment credential posture (secrets never returned).</summary>
public sealed class TenantItsmOutboundSettingsResponse
{
    public required Guid TenantId
    {
        get;
        init;
    }

    public bool HasTenantOverrides
    {
        get;
        init;
    }

    public string? JiraProjectKeyOverride
    {
        get;
        init;
    }

    public bool JiraSendInfoSeverity
    {
        get;
        init;
    }

    public string? JiraIssueTypeBySeverityJson
    {
        get;
        init;
    }

    public bool ServiceNowAutoCreateCmdbCi
    {
        get;
        init;
    }

    /// <summary>Deployment-wide outbound credential posture (masked identifiers only).</summary>
    public TenantItsmDeploymentCredentialSummary DeploymentCredentials
    {
        get;
        init;
    } = new();

    /// <summary>When <see langword="false"/>, one-click outbound create is disabled for this deployment.</summary>
    public bool NativeEnabled
    {
        get;
        init;
    }
}

/// <summary>Masked deployment credential fields from host configuration — never includes API tokens or passwords.</summary>
public sealed class TenantItsmDeploymentCredentialSummary
{
    public bool JiraConfigured
    {
        get;
        init;
    }

    public string? JiraServiceAccountEmailMasked
    {
        get;
        init;
    }

    public bool ServiceNowConfigured
    {
        get;
        init;
    }

    public string? ServiceNowUsernameMasked
    {
        get;
        init;
    }
}
