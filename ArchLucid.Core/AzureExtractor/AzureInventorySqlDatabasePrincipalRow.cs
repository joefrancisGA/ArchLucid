namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Entra user/app principal membership row from <c>sys.database_principals</c> (SN-RT-08).
/// </summary>
public sealed class AzureInventorySqlDatabasePrincipalRow
{
    public string DatabaseArmId
    {
        get;
        init;
    } = string.Empty;

    public string PrincipalName
    {
        get;
        init;
    } = string.Empty;

    public string TypeDesc
    {
        get;
        init;
    } = string.Empty;

    public string CollectionStatus
    {
        get;
        init;
    } = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded;
}
