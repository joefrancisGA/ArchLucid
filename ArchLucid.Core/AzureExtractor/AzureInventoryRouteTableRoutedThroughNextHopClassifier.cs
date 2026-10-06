using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Identifies next hops that may appear as a Routed through line (NR-23).</summary>
public static class AzureInventoryRouteTableRoutedThroughNextHopClassifier
{
    public static bool IsEligibleNextHop(GraphNode? nextHopNode)
    {
        if (nextHopNode is null)
        {
            return false;
        }

        string armType = ReadArmType(nextHopNode);

        if (armType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (armType.Contains("virtualNetworkGateways", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
            && !armType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static string ReadArmType(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.type", out string? armType) && !string.IsNullOrWhiteSpace(armType))
        {
            return armType;
        }

        return node.NodeType ?? string.Empty;
    }
}
