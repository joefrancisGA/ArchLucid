namespace ArchLucid.Contracts.Integrations;

/// <summary>Upsert body for <c>POST /v1/integrations/itsm/connections/{provider}</c> (TB-392).</summary>
public sealed class TenantItsmConnectorConnectionUpsertRequest
{
    /// <summary>Jira Cloud or ServiceNow instance base URL (non-secret).</summary>
    public required string InstanceBaseUrl
    {
        get;
        init;
    }

    /// <summary>Jira service account email or ServiceNow integration username (non-secret).</summary>
    public required string AuthUserName
    {
        get;
        init;
    }

    /// <summary>Key Vault secret name holding the API token (Jira) or password (ServiceNow).</summary>
    public required string CredentialKeyVaultSecretName
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
