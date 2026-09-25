using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Identifies resources and associations that are proven data-flow traversal hops (NR-07).
/// </summary>
public static class InventoryDiagramDataFlowTraversalHopClassifier
{
    public static bool IsTraversalHopArmType(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        return armResourceType.Equals("Microsoft.Network/applicationGateways", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/azureFirewalls", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/frontDoors", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Cdn/profiles", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/loadBalancers", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/natGateways", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/virtualNetworkGateways", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/privateEndpoints", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsTraversalHopAssociation(string? associationType, string? inferenceSource)
    {
        if (IsExcludedTraversalAnnotation(associationType, inferenceSource))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(associationType))
        {
            if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.FrontDoorToOrigin, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.AgwToBackend, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.LbToBackend, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.FirewallToSubnet, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.NatGatewayToSubnet, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.PeReachableTarget, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.NetworkConnection, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (!string.IsNullOrWhiteSpace(inferenceSource))
        {
            return inferenceSource.Equals("inventory-front-door-origin", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-agw-backend", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-lb-backend", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-firewall-subnet", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-nat-gateway-subnet", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-pe-reachable-target", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-private-endpoint", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-pe-subnet", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-pe-nic", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-network-connection", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-route-table-route", StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public static bool IsExcludedTraversalAnnotation(string? associationType, string? inferenceSource)
    {
        if (!string.IsNullOrWhiteSpace(associationType))
        {
            if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.NsgAllowRule, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.SubnetToNsg, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.NicToNsg, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination, StringComparison.OrdinalIgnoreCase)
                || associationType.Equals(AzureInventoryRelationshipAssociationTypes.SubnetToRouteTable, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (!string.IsNullOrWhiteSpace(inferenceSource))
        {
            return inferenceSource.Equals("inventory-nsg-allow-rule", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-subnet-nsg", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-nic-nsg", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-nsg-policy-attachment", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-diagnostic-destination", StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals("inventory-subnet-route-table", StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public static bool IsTraversalHopNode(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string armType = ReadArmType(node);

        return IsTraversalHopArmType(armType);
    }

    private static string ReadArmType(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.type", out string? armType) && !string.IsNullOrWhiteSpace(armType))
        {
            return armType;
        }

        return node.NodeType;
    }
}
