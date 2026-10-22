namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized PaaS parent/child metadata (AX-DE-14).
/// </summary>
public sealed class AzureInventoryPaasChildAssociationRow
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
    } = AzureInventoryPaasChildAssociationTypes.PaasChild;

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
