namespace ArchLucid.Contracts.Integrations;

/// <summary>Upsert body for <c>POST /v1/integrations/itsm/connections/{provider}</c> (TB-392 / TB-600).</summary>
public sealed class TenantItsmConnectorConnectionUpsertRequest
{
    /// <summary>Jira Cloud or ServiceNow instance base URL (non-secret).</summary>
    public required string InstanceBaseUrl
    {
        get;
        init;
    }

    /// <summary>Defaults to <c>BasicApiToken</c> when omitted (backward compatible).</summary>
    public string? AuthMode
    {
        get;
        init;
    }

    /// <summary>Jira service account email or ServiceNow integration username (required for <c>BasicApiToken</c>).</summary>
    public string? AuthUserName
    {
        get;
        init;
    }

    /// <summary>Key Vault secret name holding the API token (Jira) or password (ServiceNow) for <c>BasicApiToken</c>.</summary>
    public string? CredentialKeyVaultSecretName
    {
        get;
        init;
    }

    /// <summary>Key Vault secret name holding the OAuth client id (OAuth modes).</summary>
    public string? OAuthClientIdKeyVaultSecretName
    {
        get;
        init;
    }

    /// <summary>Key Vault secret name holding the OAuth client secret (OAuth modes).</summary>
    public string? OAuthClientSecretKeyVaultSecretName
    {
        get;
        init;
    }

    /// <summary>Key Vault secret name holding the OAuth refresh token (<c>OAuth2RefreshToken</c> mode).</summary>
    public string? OAuthRefreshTokenKeyVaultSecretName
    {
        get;
        init;
    }

    /// <summary>Optional Key Vault secret name for inbound webhook shared-secret verification.</summary>
    public string? InboundWebhookKeyVaultSecretName
    {
        get;
        init;
    }

    public bool IsEnabled { get; init; } = true;

    public string? Label
    {
        get;
        init;
    }
}
