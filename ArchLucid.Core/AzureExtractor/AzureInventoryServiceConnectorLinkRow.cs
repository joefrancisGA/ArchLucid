namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized Service Connector linker metadata (AX-DE-17).
/// </summary>
public sealed class AzureInventoryServiceConnectorLinkRow
{
    public string SourceResourceId
    {
        get;
        init;
    } = string.Empty;

    public string LinkerName
    {
        get;
        init;
    } = string.Empty;

    public string? LinkerResourceId
    {
        get;
        init;
    }

    public string? TargetResourceId
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
