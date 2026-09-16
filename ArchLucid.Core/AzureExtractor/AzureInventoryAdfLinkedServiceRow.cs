namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized Azure Data Factory linked-service evidence row (no secret-bearing fields).
/// </summary>
public sealed class AzureInventoryAdfLinkedServiceRow
{
    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string LinkedServiceResourceId
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

    public string? TargetResourceId
    {
        get;
        init;
    }

    public string? TargetHost
    {
        get;
        init;
    }

    public string? KeyVaultResourceId
    {
        get;
        init;
    }

    public string? IntegrationRuntimeName
    {
        get;
        init;
    }

    public string CollectionStatus
    {
        get;
        init;
    } = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded;

    public string? WarningCode
    {
        get;
        init;
    }
}
