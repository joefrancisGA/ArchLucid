namespace ArchLucid.Contracts.Admin;

public sealed class TenantAzureOpenAiConnectionUpsertRequest
{
    public string? Endpoint
    {
        get;
        init;
    }

    public string? AuthMode
    {
        get;
        init;
    }

    public string? ApiKeyKeyVaultSecretName
    {
        get;
        init;
    }

    /// <summary>Optional one-time API key material written to Key Vault via <see cref="ApiKeyKeyVaultSecretName" />.</summary>
    public string? ApiKey
    {
        get;
        init;
    }

    public string? DeploymentsJson
    {
        get;
        init;
    }

    public bool? IsEnabled
    {
        get;
        init;
    }

    public string? Label
    {
        get;
        init;
    }
}
