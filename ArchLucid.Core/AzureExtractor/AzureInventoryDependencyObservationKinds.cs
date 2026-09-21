namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Allowed <c>observationKind</c> values for <c>dependency-observations.json</c> (SN-RT-06).
/// </summary>
public static class AzureInventoryDependencyObservationKinds
{
    public const string SqlDependency = "sqlDependency";

    public const string SqlAudit = "sqlAudit";

    public const string StorageBlob = "storageBlob";

    public const string StorageQueue = "storageQueue";

    public const string KeyVault = "keyVault";

    public const string ManagedIdentitySignIn = "managedIdentitySignIn";

    public const string HttpDependency = "httpDependency";

    public static bool IsValid(string? observationKind)
    {
        if (string.IsNullOrWhiteSpace(observationKind))
        {
            return false;
        }

        return observationKind.Equals(SqlDependency, StringComparison.OrdinalIgnoreCase)
               || observationKind.Equals(SqlAudit, StringComparison.OrdinalIgnoreCase)
               || observationKind.Equals(StorageBlob, StringComparison.OrdinalIgnoreCase)
               || observationKind.Equals(StorageQueue, StringComparison.OrdinalIgnoreCase)
               || observationKind.Equals(KeyVault, StringComparison.OrdinalIgnoreCase)
               || observationKind.Equals(ManagedIdentitySignIn, StringComparison.OrdinalIgnoreCase)
               || observationKind.Equals(HttpDependency, StringComparison.OrdinalIgnoreCase);
    }
}
