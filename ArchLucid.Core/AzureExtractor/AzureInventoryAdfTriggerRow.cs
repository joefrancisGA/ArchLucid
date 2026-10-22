namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized ADF trigger metadata (no secret-bearing fields).
/// </summary>
public sealed class AzureInventoryAdfTriggerRow
{
    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string TriggerResourceId
    {
        get;
        init;
    } = string.Empty;

    public string TriggerName
    {
        get;
        init;
    } = string.Empty;

    public string TriggerType
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> PipelineNames
    {
        get;
        init;
    } = [];

    public string? SourceResourceId
    {
        get;
        init;
    }

    public string? SourceHost
    {
        get;
        init;
    }

    public string? ScheduleRecurrence
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
