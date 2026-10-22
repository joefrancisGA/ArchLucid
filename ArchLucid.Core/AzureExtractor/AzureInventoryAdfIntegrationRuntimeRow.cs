namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized ADF integration runtime metadata (no secret-bearing fields).
/// </summary>
public sealed class AzureInventoryAdfIntegrationRuntimeRow
{
    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string IntegrationRuntimeResourceId
    {
        get;
        init;
    } = string.Empty;

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string Kind
    {
        get;
        init;
    } = string.Empty;

    public string? SubnetId
    {
        get;
        init;
    }

    public string? State
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
