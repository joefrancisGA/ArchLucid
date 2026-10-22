namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized ADF mapping data flow metadata (static linked-service references only).
/// </summary>
public sealed class AzureInventoryAdfDataflowRow
{
    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string DataflowResourceId
    {
        get;
        init;
    } = string.Empty;

    public string DataflowName
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> SourceLinkedServiceNames
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> SinkLinkedServiceNames
    {
        get;
        init;
    } = [];

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
