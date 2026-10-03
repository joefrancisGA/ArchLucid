namespace ArchLucid.Core.AzureExtractor;

/// <summary>Closed catalog of shared-service ARM types (VN-35, NR-12).</summary>
public static class InventoryDiagramSharedServiceCatalog
{
    private static readonly HashSet<string> SharedServiceArmTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "Microsoft.OperationalInsights/workspaces",
        "Microsoft.Insights/actionGroups",
        "Microsoft.ManagedIdentity/userAssignedIdentities",
        "Microsoft.KeyVault/vaults",
        "Microsoft.Network/privateDnsZones",
        "Microsoft.Network/dnsZones",
    };

    public static bool IsSharedService(string? armResourceType)
    {
        return !string.IsNullOrWhiteSpace(armResourceType)
            && SharedServiceArmTypes.Contains(armResourceType.Trim());
    }
}
