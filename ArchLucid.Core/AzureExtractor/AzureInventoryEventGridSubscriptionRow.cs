namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized Event Grid subscription metadata (AX-DE-11).
/// </summary>
public sealed class AzureInventoryEventGridSubscriptionRow
{
    public string SourceResourceId
    {
        get;
        init;
    } = string.Empty;

    public string SubscriptionName
    {
        get;
        init;
    } = string.Empty;

    public string? SubscriptionResourceId
    {
        get;
        init;
    }

    public string? DestinationResourceId
    {
        get;
        init;
    }

    public string? DestinationHost
    {
        get;
        init;
    }

    public string DestinationKind
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
