namespace ArchLucid.Core.AiProviders;

/// <summary>Per-tenant Azure OpenAI BYO connection metadata (secret material lives in Key Vault only).</summary>
public sealed class TenantAzureOpenAiConnectionRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string Endpoint
    {
        get;
        init;
    } = "";

    public TenantAzureOpenAiAuthMode AuthMode
    {
        get;
        init;
    }

    public string ApiKeyKeyVaultSecretName
    {
        get;
        init;
    } = "";

    /// <summary>JSON map of model tier name to deployment name (see <see cref="TenantAzureOpenAiDeploymentsCatalog" />).</summary>
    public string DeploymentsJson
    {
        get;
        init;
    } = "";

    public bool IsEnabled
    {
        get;
        init;
    }

    public string? Label
    {
        get;
        init;
    }

    public bool? LastProbeSucceeded
    {
        get;
        init;
    }

    public string? LastProbeMessage
    {
        get;
        init;
    }

    public DateTimeOffset? LastProbeUtc
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }

    /// <summary>Stable provider connection identifier for traces and audit (TB-872).</summary>
    public string ProviderConnectionId => TenantId.ToString("N");
}
