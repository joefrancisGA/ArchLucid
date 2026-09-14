namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     ARM resource types omitted from inventory lists, resource counts, topology node materialization,
///     and inventory diagram rendering. Collectors may still read these rows to derive companion
///     association edges before filtering them out.
/// </summary>
public static class AzureInventoryNeverShowArmTypes
{
    public const string DiagramCollapseKind = "AlwaysDisposeArmType";

    public static readonly string[] CatalogArmTypes =
    [
        "Microsoft.Portal/dashboards",
        "Microsoft.Network/dnszones",
        "Microsoft.Network/privateDnsZones",
        "Microsoft.Network/dnsResolvers",
        "Microsoft.Compute/virtualMachines/extensions",
        "Microsoft.Compute/virtualMachineScaleSets/extensions",
        "Microsoft.HybridCompute/machines/extensions",
        "Microsoft.Maintenance/maintenanceConfigurations",
        "Microsoft.Maintenance/configurationAssignments",
        "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
        "Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks",
    ];

    private static readonly string[] LastSegments =
    [
        "dashboards",
        "extensions",
        "dnssettings",
        "dnszones",
        "privatednszones",
        "dnsresolvers",
        "virtualnetworklinks",
        "maintenanceconfigurations",
        "configurationassignments",
    ];

    public static readonly string[] ResourceTypeLastSegmentSuffixes = LastSegments;

    public static bool ShouldOmitFromInventory(string? armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        if (CatalogArmTypes.Contains(armType, StringComparer.OrdinalIgnoreCase))
        {
            return true;
        }

        string lastSegment = armType
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault() ?? string.Empty;

        return LastSegments.Contains(lastSegment, StringComparer.OrdinalIgnoreCase);
    }
}
