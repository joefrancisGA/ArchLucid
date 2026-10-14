using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Resolves a SQL database ARM id from redacted app-setting host metadata (AX-DE-18).
/// </summary>
public static class AzureInventoryAppSettingHostSqlTargetResolver
{
    public static bool TryResolveSqlDatabaseArmId(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        AzureInventoryAppSettingHostRow row,
        out string databaseArmId)
    {
        databaseArmId = string.Empty;

        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(row);

        if (!QualifiesForConnectionStringConversion(row))
        {
            return false;
        }

        string normalizedHost = row.Host!.Trim().ToLowerInvariant();
        Dictionary<string, string> hostIndex = AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex(resources);
        string catalogKey = $"{normalizedHost}|{row.Catalog!.Trim().ToLowerInvariant()}";

        if (!hostIndex.TryGetValue(catalogKey, out databaseArmId!))
        {
            return false;
        }

        databaseArmId = ArmResourceIdNormalizer.Normalize(databaseArmId);

        return databaseArmId.Contains("/microsoft.sql/servers/", StringComparison.OrdinalIgnoreCase)
            && databaseArmId.Contains("/databases/", StringComparison.OrdinalIgnoreCase);
    }

    public static bool QualifiesForConnectionStringConversion(AzureInventoryAppSettingHostRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (!row.CollectionStatus.Equals(
                AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(row.Host) || string.IsNullOrWhiteSpace(row.Catalog))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(row.KeyVaultHost))
        {
            return false;
        }

        string normalizedHost = row.Host.Trim().ToLowerInvariant();

        if (!normalizedHost.EndsWith(".database.windows.net", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (AzureInventoryNeverShowSqlDatabaseNames.NeverShowDatabaseNames
            .Contains(row.Catalog.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }
}
