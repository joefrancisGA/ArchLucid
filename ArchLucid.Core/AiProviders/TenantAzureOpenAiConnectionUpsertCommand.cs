namespace ArchLucid.Core.AiProviders;

public sealed class TenantAzureOpenAiConnectionUpsertCommand
{
    public required string Endpoint
    {
        get;
        init;
    }

    public TenantAzureOpenAiAuthMode AuthMode
    {
        get;
        init;
    } = TenantAzureOpenAiAuthMode.ApiKey;

    public required string ApiKeyKeyVaultSecretName
    {
        get;
        init;
    }

    public required string DeploymentsJson
    {
        get;
        init;
    }

    public bool IsEnabled
    {
        get;
        init;
    } = true;

    public string? Label
    {
        get;
        init;
    }
}
