namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalized AVD session host to backing VM association.
/// </summary>
public sealed class AzureInventoryAvdSessionHostAssociationRow
{
    public string SessionHostResourceId
    {
        get;
        init;
    } = string.Empty;

    public string VirtualMachineResourceId
    {
        get;
        init;
    } = string.Empty;

    public string AssociationType
    {
        get;
        init;
    } = AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm;
}
