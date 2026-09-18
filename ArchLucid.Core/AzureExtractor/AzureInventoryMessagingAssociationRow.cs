namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized messaging child / capture metadata (AX-DE-13).
/// </summary>
public sealed class AzureInventoryMessagingAssociationRow
{
    public string ParentResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ChildResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ChildName
    {
        get;
        init;
    } = string.Empty;

    public string ChildType
    {
        get;
        init;
    } = string.Empty;

    public string AssociationType
    {
        get;
        init;
    } = AzureInventoryMessagingAssociationTypes.MessagingChild;

    public string? CaptureStorageAccountId
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
