namespace ArchLucid.Core.AzureExtractor;

/// <summary>Classifies inventory resources whose indirect relationships NR-04 resolves from cited evidence.</summary>
public static class InventoryDiagramIndirectRelationshipClassifier
{
    public static bool TryClassify(string? armResourceType, out InventoryDiagramIndirectRelationshipCategory category)
    {
        category = default;

        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        if (armResourceType.Contains("vaults", StringComparison.OrdinalIgnoreCase)
            && armResourceType.Contains("KeyVault", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.KeyVault;
            return true;
        }

        if (armResourceType.Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.StorageAccount;
            return true;
        }

        if (armResourceType.Contains("ContainerRegistry/registries", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.Registry;
            return true;
        }

        if (armResourceType.Contains("privateLinkScopes", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.PrivateLinkScope;
            return true;
        }

        if (armResourceType.Contains("networkSecurityPerimeters", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.NetworkSecurityPerimeter;
            return true;
        }

        if (armResourceType.Contains("virtualNetworkGateways", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/localNetworkGateways", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.NetGateway;
            return true;
        }

        if (armResourceType.Contains("loadBalancers", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.LoadBalancer;
            return true;
        }

        if (armResourceType.Contains("bastionHosts", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.BastionHost;
            return true;
        }

        if (armResourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.AzureFirewall;
            return true;
        }

        if (armResourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
            && !armResourceType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.VirtualMachine;
            return true;
        }

        if (armResourceType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.VirtualMachineScaleSet;
            return true;
        }

        if (armResourceType.Contains("managedClusters", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.KubernetesCluster;
            return true;
        }

        if (armResourceType.Contains("DBforMySQL", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.MySql;
            return true;
        }

        if (armResourceType.Contains("Cache/redis", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.RedisCache;
            return true;
        }

        if (armResourceType.Contains("managedGrafana", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.Grafana;
            return true;
        }

        if (armResourceType.Contains("fabric/capacities", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.FabricCapacity;
            return true;
        }

        if (armResourceType.Contains("staticSites", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.StaticSite;
            return true;
        }

        if (armResourceType.Contains("hostPools", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramIndirectRelationshipCategory.HostPool;
            return true;
        }

        return false;
    }
}
