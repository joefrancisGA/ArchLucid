namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryAdfExternalSourceWrite
{
    public string ExternalNodeKey
    {
        get;
        init;
    } = string.Empty;

    public string LinkedServiceName
    {
        get;
        init;
    } = string.Empty;

    public string LinkedServiceType
    {
        get;
        init;
    } = string.Empty;

    public string? TargetHost
    {
        get;
        init;
    }

    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string? IntegrationRuntimeName
    {
        get;
        init;
    }

    public bool HostInKeyVault
    {
        get;
        init;
    }

    public string? KeyVaultResourceId
    {
        get;
        init;
    }
}
