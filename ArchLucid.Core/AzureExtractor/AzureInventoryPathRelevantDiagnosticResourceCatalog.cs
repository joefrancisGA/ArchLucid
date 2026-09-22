namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Bounded allow-list of ARM types that receive diagnostic-settings GET fan-out (AX-DE-10).
/// </summary>
public static class AzureInventoryPathRelevantDiagnosticResourceCatalog
{
    // Bounded to path-relevant PaaS types; each inventoried match is O(1) GET — not every ARM type.
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "Microsoft.Storage/storageAccounts",
        "Microsoft.KeyVault/vaults",
        "Microsoft.Network/networkSecurityGroups",
        "Microsoft.Sql/servers",
        "Microsoft.DataFactory/factories",
        "Microsoft.Synapse/workspaces",
        "Microsoft.EventHub/namespaces",
        "Microsoft.ServiceBus/namespaces",
        "Microsoft.Web/sites",
        "Microsoft.ContainerService/managedClusters",
        "Microsoft.Network/applicationGateways",
        "Microsoft.Network/azureFirewalls",
        "Microsoft.DocumentDB/databaseAccounts",
    };

    public static bool IsPathRelevant(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return AllowedTypes.Contains(resourceType.Trim());
    }
}
