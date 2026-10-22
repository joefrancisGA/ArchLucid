namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Child resource kinds for <c>paas-child-associations.json</c> (AX-DE-14).
/// </summary>
public static class AzureInventoryPaasChildAssociationTypes
{
    public const string SqlDatabase = "sqlDatabase";

    public const string CosmosDatabase = "cosmosDatabase";

    public const string StorageBlobContainer = "storageBlobContainer";

    public const string StorageAdlsFilesystem = "storageAdlsFilesystem";

    public const string PaasChild = "paasChild";
}
