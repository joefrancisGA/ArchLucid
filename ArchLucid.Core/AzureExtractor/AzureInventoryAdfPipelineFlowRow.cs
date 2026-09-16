namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized declared ADF pipeline activity dataset flow (input or output reference).
/// </summary>
public sealed class AzureInventoryAdfPipelineFlowRow
{
    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string PipelineResourceId
    {
        get;
        init;
    } = string.Empty;

    public string PipelineName
    {
        get;
        init;
    } = string.Empty;

    public string ActivityName
    {
        get;
        init;
    } = string.Empty;

    public string ActivityType
    {
        get;
        init;
    } = string.Empty;

    public string FlowDirection
    {
        get;
        init;
    } = string.Empty;

    public string DatasetName
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
