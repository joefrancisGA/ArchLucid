namespace ArchLucid.Contracts.InfraEvidence.DiagramPeel;

/// <summary>Last-segment suffixes that always-dispose even when a catalog row has not been seeded yet.</summary>
public static class DiagramPeelAlwaysDisposeArmTypes
{
    public const string CollapseKind = "AlwaysDisposeArmType";

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

    public static bool MatchesSuffix(string? armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        string lastSegment = armType
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault() ?? string.Empty;

        return LastSegments.Contains(lastSegment, StringComparer.OrdinalIgnoreCase);
    }
}
