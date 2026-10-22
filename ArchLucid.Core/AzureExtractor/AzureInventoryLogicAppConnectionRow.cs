namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized Logic App connection metadata (AX-DE-12).
/// </summary>
public sealed class AzureInventoryLogicAppConnectionRow
{
    public string WorkflowResourceId
    {
        get;
        init;
    } = string.Empty;

    public string WorkflowName
    {
        get;
        init;
    } = string.Empty;

    public string ConnectionName
    {
        get;
        init;
    } = string.Empty;

    public string? ConnectionResourceId
    {
        get;
        init;
    }

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
