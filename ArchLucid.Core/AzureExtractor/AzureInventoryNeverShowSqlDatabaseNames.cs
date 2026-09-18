namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     SQL Server database names omitted from inventory lists, counts, diagrams, and drift comparison.
///     Scoped to Azure SQL logical-server and managed-instance database ARM resources.
/// </summary>
public static class AzureInventoryNeverShowSqlDatabaseNames
{
    public static readonly string[] NeverShowDatabaseNames =
    [
        "master",
    ];

    private static readonly string[] SqlDatabaseArmTypePrefixes =
    [
        "Microsoft.Sql/servers/databases",
        "Microsoft.Sql/managedInstances/databases",
    ];

    public static bool ShouldOmit(string? resourceType, string? azureResourceId, string? resourceName = null)
    {
        if (!IsSqlDatabaseResource(resourceType, azureResourceId))
        {
            return false;
        }

        string? effectiveName = string.IsNullOrWhiteSpace(resourceName)
            ? TryReadArmResourceName(azureResourceId)
            : resourceName.Trim();

        if (string.IsNullOrWhiteSpace(effectiveName))
        {
            return false;
        }

        return NeverShowDatabaseNames.Contains(effectiveName, StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsSqlDatabaseResource(string? resourceType, string? azureResourceId)
    {
        if (!string.IsNullOrWhiteSpace(resourceType))
        {
            string trimmedType = resourceType.Trim();

            foreach (string prefix in SqlDatabaseArmTypePrefixes)
            {
                if (trimmedType.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
        }

        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        string normalized = azureResourceId.Trim();

        return (normalized.Contains("/microsoft.sql/servers/", StringComparison.OrdinalIgnoreCase)
                && normalized.Contains("/databases/", StringComparison.OrdinalIgnoreCase))
               || (normalized.Contains("/microsoft.sql/managedinstances/", StringComparison.OrdinalIgnoreCase)
                   && normalized.Contains("/databases/", StringComparison.OrdinalIgnoreCase));
    }

    private static string? TryReadArmResourceName(string? azureResourceId)
    {
        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return null;
        }

        string[] segments = azureResourceId.Split(
            '/',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length == 0)
        {
            return null;
        }

        return segments[^1];
    }
}
