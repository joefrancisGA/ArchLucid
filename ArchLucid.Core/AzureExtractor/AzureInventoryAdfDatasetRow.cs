namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized Azure Data Factory dataset metadata (no secret-bearing fields).
/// </summary>
public sealed class AzureInventoryAdfDatasetRow
{
    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string DatasetResourceId
    {
        get;
        init;
    } = string.Empty;

    public string DatasetName
    {
        get;
        init;
    } = string.Empty;

    public string LinkedServiceName
    {
        get;
        init;
    } = string.Empty;

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
