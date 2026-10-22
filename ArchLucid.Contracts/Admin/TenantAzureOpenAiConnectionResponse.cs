namespace ArchLucid.Contracts.Admin;

public sealed class TenantAzureOpenAiConnectionResponse
{
    public Guid TenantId
    {
        get;
        init;
    }

    public bool IsConfigured
    {
        get;
        init;
    }

    public string? ProviderConnectionId
    {
        get;
        init;
    }

    public string? Endpoint
    {
        get;
        init;
    }

    public string AuthMode
    {
        get;
        init;
    } = "ApiKey";

    public string? ApiKeyKeyVaultSecretName
    {
        get;
        init;
    }

    public string? DeploymentsJson
    {
        get;
        init;
    }

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

    public DateTimeOffset? UpdatedUtc
    {
        get;
        init;
    }
}
