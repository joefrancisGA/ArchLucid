namespace ArchLucid.Contracts.InfraEvidence.DiagramPeel;

/// <summary>Default peel catalog when SQL is unavailable or the table is empty (IE-17).</summary>
public static class DiagramPeelCatalogDefaultSeed
{
    public const int DefaultCatalogVersion = 1;

    public static DiagramPeelCatalogSnapshot BuildSnapshot()
    {
        return new DiagramPeelCatalogSnapshot
        {
            CatalogVersion = DefaultCatalogVersion,
            Entries = BuildEntries(),
        };
    }

    public static IReadOnlyList<DiagramPeelCatalogEntry> BuildEntries()
    {
        return
        [
            Entry("Microsoft.Network/networkWatchers", 10, "Platform noise — not topology"),
            Entry("Microsoft.Insights/diagnosticSettings", 10, "Observability attachment"),
            Entry("Microsoft.Resources/deployments", 10, "Deployment history"),
            Entry("Microsoft.Authorization/locks", 10, "Governance metadata"),
            Entry("Microsoft.Network/virtualNetworks/subnets", 20, "Child resource — nest under VNet swimlane"),
            Entry("Microsoft.Network/networkSecurityGroups/securityRules", 20, "Child resource — rules on NSG"),
            Entry("Microsoft.Network/routeTables/routes", 20, "Child resource — routes on table"),
            Entry("Microsoft.Network/loadBalancers/backendAddressPools", 20, "Child resource — LB pool"),
            Entry("Microsoft.Network/loadBalancers/probes", 20, "Child resource — LB probe"),
            Entry("Microsoft.Network/applicationGateways/frontendIPConfigurations", 20, "Child resource — AppGw frontend"),
            Entry("Microsoft.Storage/storageAccounts/blobServices", 20, "Child resource — storage sub-service"),
            Entry("Microsoft.Compute/virtualMachines/extensions", 20, "Child resource — VM extension"),
            Entry("Microsoft.Network/networkInterfaces", 30, "Attachment — VM/NIC hop"),
            Entry("Microsoft.Network/publicIPAddresses", 40, "Attachment — address on NIC/LB"),
            Entry("Microsoft.Compute/disks", 50, "Attachment — disk on VM"),
            Backbone("Microsoft.Network/virtualNetworks"),
            Backbone("Microsoft.Compute/virtualMachines"),
            Backbone("Microsoft.Web/sites"),
            Backbone("Microsoft.Storage/storageAccounts"),
            Backbone("Microsoft.Sql/servers"),
            Backbone("Microsoft.ManagedIdentity/userAssignedIdentities"),
            Backbone("Microsoft.Network/azureFirewalls"),
            Backbone("Microsoft.Network/applicationGateways"),
            Backbone("Microsoft.Network/loadBalancers"),
            Backbone("Microsoft.Network/privateEndpoints"),
        ];
    }

    private static DiagramPeelCatalogEntry Entry(string armResourceType, int peelRank, string notes)
    {
        return new DiagramPeelCatalogEntry
        {
            ArmResourceType = armResourceType,
            PeelRank = peelRank,
            IsEnabled = true,
            Notes = notes,
        };
    }

    private static DiagramPeelCatalogEntry Backbone(string armResourceType)
    {
        return new DiagramPeelCatalogEntry
        {
            ArmResourceType = armResourceType,
            PeelRank = null,
            IsEnabled = true,
            Notes = "Backbone — never peel",
        };
    }
}
