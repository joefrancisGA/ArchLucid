namespace ArchLucid.Core.AzureExtractor;

/// <summary>Classifies inventory resources that attach to a proven parent instead of floating (NR-03).</summary>
public static class InventoryDiagramParentAttachmentClassifier
{
    public static bool TryClassify(string? armResourceType, out InventoryDiagramParentAttachmentCategory category)
    {
        category = default;

        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        if (armResourceType.Equals("Microsoft.Network/publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramParentAttachmentCategory.PublicIp;
            return true;
        }

        if (IsNamespaceChildArmType(armResourceType))
        {
            category = InventoryDiagramParentAttachmentCategory.NamespaceChild;
            return true;
        }

        if (armResourceType.Equals("Microsoft.Compute/restorePointCollections", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramParentAttachmentCategory.RestorePointCollection;
            return true;
        }

        if (armResourceType.Equals("Microsoft.VirtualMachineImages/imageTemplates", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramParentAttachmentCategory.ImageTemplate;
            return true;
        }

        if (IsAccessConnectorArmType(armResourceType))
        {
            category = InventoryDiagramParentAttachmentCategory.AccessConnector;
            return true;
        }

        if (IsComponentArmType(armResourceType))
        {
            category = InventoryDiagramParentAttachmentCategory.Component;
            return true;
        }

        if (IsServiceArmType(armResourceType))
        {
            category = InventoryDiagramParentAttachmentCategory.Service;
            return true;
        }

        return false;
    }

    public static bool IsValidParentArmType(
        InventoryDiagramParentAttachmentCategory category,
        string? parentArmType)
    {
        if (string.IsNullOrWhiteSpace(parentArmType))
        {
            return false;
        }

        return category switch
        {
            InventoryDiagramParentAttachmentCategory.PublicIp => IsPublicIpParentArmType(parentArmType),
            InventoryDiagramParentAttachmentCategory.NamespaceChild => IsMessagingNamespaceArmType(parentArmType),
            InventoryDiagramParentAttachmentCategory.Component => IsComponentOwnerArmType(parentArmType),
            InventoryDiagramParentAttachmentCategory.Service => IsServiceOwnerArmType(parentArmType),
            InventoryDiagramParentAttachmentCategory.RestorePointCollection =>
                parentArmType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
                || parentArmType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase),
            InventoryDiagramParentAttachmentCategory.AccessConnector => IsAccessConnectorOwnerArmType(parentArmType),
            InventoryDiagramParentAttachmentCategory.ImageTemplate => false,
            _ => false,
        };
    }

    private static bool IsNamespaceChildArmType(string armResourceType)
    {
        return armResourceType.Contains("/namespaces/queues", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/namespaces/topics", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/namespaces/eventhubs", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/namespaces/hybridconnections", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/namespaces/wcfrelays", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsComponentArmType(string armResourceType)
    {
        return armResourceType.Contains("/applicationGateways/", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/containerApps/", StringComparison.OrdinalIgnoreCase)
            || (armResourceType.Contains("Microsoft.Web/sites/", StringComparison.OrdinalIgnoreCase)
                && !armResourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsServiceArmType(string armResourceType)
    {
        return armResourceType.Contains("/service/apis", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/containerApps/", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/managedClusters/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAccessConnectorArmType(string armResourceType)
    {
        return armResourceType.Contains("accessConnectors", StringComparison.OrdinalIgnoreCase)
            || (armResourceType.Contains("Microsoft.Purview/accounts/", StringComparison.OrdinalIgnoreCase)
                && !armResourceType.Equals("Microsoft.Purview/accounts", StringComparison.OrdinalIgnoreCase))
            || (armResourceType.Contains("Microsoft.DataFactory/factories/", StringComparison.OrdinalIgnoreCase)
                && armResourceType.Contains("integrationRuntimes", StringComparison.OrdinalIgnoreCase))
            || armResourceType.Contains("managedPrivateEndpoints", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPublicIpParentArmType(string parentArmType)
    {
        return parentArmType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("loadBalancers", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("virtualNetworkGateways", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("bastionHosts", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("natGateways", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsMessagingNamespaceArmType(string parentArmType)
    {
        return parentArmType.Equals("Microsoft.ServiceBus/namespaces", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Equals("Microsoft.EventHub/namespaces", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Equals("Microsoft.Relay/namespaces", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsComponentOwnerArmType(string parentArmType)
    {
        return parentArmType.Contains("applicationGateways", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsServiceOwnerArmType(string parentArmType)
    {
        return parentArmType.Contains("Microsoft.ApiManagement/service", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("managedClusters", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAccessConnectorOwnerArmType(string parentArmType)
    {
        return parentArmType.Contains("Microsoft.Purview/accounts", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("Microsoft.DataFactory/factories", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("Microsoft.Synapse/workspaces", StringComparison.OrdinalIgnoreCase)
            || parentArmType.Contains("Microsoft.Databricks/workspaces", StringComparison.OrdinalIgnoreCase);
    }
}
