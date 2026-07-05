namespace ArchLucid.Contracts.Integrations;

/// <summary>Per-tenant ITSM connector row returned by <c>/v1/integrations/itsm/connections</c> (never includes secret values).</summary>
public sealed class TenantItsmConnectorConnectionResponse
{
    public Guid TenantId
    {
        get;
        init;
    }

    /// <summary><c>Jira</c> or <c>ServiceNow</c>.</summary>
    public required string Provider
    {
        get;
        init;
    }

    public bool IsConfigured
    {
        get;
        init;
    }

    public bool IsEnabled
    {
        get;
        init;
    }

    public string? InstanceBaseUrl
    {
        get;
        init;
    }

    public string? AuthUserName
    {
        get;
        init;
    }

    public string? CredentialKeyVaultSecretName
    {
        get;
        init;
    }

    public string? AuthMode
    {
        get;
        init;
    }

    public string? OAuthClientIdKeyVaultSecretName
    {
        get;
        init;
    }

    public string? OAuthClientSecretKeyVaultSecretName
    {
        get;
        init;
    }

    public string? OAuthRefreshTokenKeyVaultSecretName
    {
        get;
        init;
    }

    public string? InboundWebhookKeyVaultSecretName
    {
        get;
        init;
    }

    public string? Label
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }
}
