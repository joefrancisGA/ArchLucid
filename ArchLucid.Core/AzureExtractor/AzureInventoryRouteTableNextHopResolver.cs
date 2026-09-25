using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Resolves a route-table next hop to a cited ARM resource id when proven (NR-02).
/// </summary>
public static class AzureInventoryRouteTableNextHopResolver
{
    public static string? Resolve(
        AzureInventoryRouteTableRoute route,
        IReadOnlyList<GraphNode> topologyNodes)
    {
        ArgumentNullException.ThrowIfNull(route);
        ArgumentNullException.ThrowIfNull(topologyNodes);

        if (!string.IsNullOrWhiteSpace(route.NextHopArmId)
            && route.NextHopArmId.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return ArmResourceIdNormalizer.Normalize(route.NextHopArmId);
        }

        string? nextHopType = route.NextHopType?.Trim();

        if (string.IsNullOrWhiteSpace(nextHopType))
        {
            return null;
        }

        if (nextHopType.Equals("Internet", StringComparison.OrdinalIgnoreCase)
            || nextHopType.Equals("VnetLocal", StringComparison.OrdinalIgnoreCase)
            || nextHopType.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (nextHopType.Equals("VirtualNetworkGateway", StringComparison.OrdinalIgnoreCase))
        {
            return TryResolveGatewayArmId(route.NextHopIpAddress, topologyNodes);
        }

        if (nextHopType.Equals("VirtualAppliance", StringComparison.OrdinalIgnoreCase))
        {
            return TryResolveIpAddressOwner(route.NextHopIpAddress, topologyNodes);
        }

        return null;
    }

    private static string? TryResolveGatewayArmId(
        string? nextHopValue,
        IReadOnlyList<GraphNode> topologyNodes)
    {
        if (!string.IsNullOrWhiteSpace(nextHopValue)
            && nextHopValue.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return ArmResourceIdNormalizer.Normalize(nextHopValue);
        }

        foreach (GraphNode node in topologyNodes)
        {
            string armType = ReadArmType(node);

            if (!armType.Contains("virtualNetworkGateways", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string armId = ReadArmId(node);

            if (!string.IsNullOrWhiteSpace(armId))
            {
                return ArmResourceIdNormalizer.Normalize(armId);
            }
        }

        return null;
    }

    private static string? TryResolveIpAddressOwner(
        string? nextHopIpAddress,
        IReadOnlyList<GraphNode> topologyNodes)
    {
        if (string.IsNullOrWhiteSpace(nextHopIpAddress))
        {
            return null;
        }

        string normalizedIp = nextHopIpAddress.Trim();

        foreach (GraphNode node in topologyNodes)
        {
            string armType = ReadArmType(node);

            if (!armType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase)
                && !armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
                && !armType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (NodeContainsPrivateIp(node, normalizedIp))
            {
                return ArmResourceIdNormalizer.Normalize(ReadArmId(node));
            }
        }

        return null;
    }

    private static bool NodeContainsPrivateIp(GraphNode node, string ipAddress)
    {
        if (!node.Properties.TryGetValue("ipConfigurations", out string? ipConfigurationsJson)
            || string.IsNullOrWhiteSpace(ipConfigurationsJson))
        {
            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(ipConfigurationsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return false;
            }

            foreach (JsonElement ipConfiguration in document.RootElement.EnumerateArray())
            {
                if (!ipConfiguration.TryGetProperty("properties", out JsonElement propertiesElement)
                    || propertiesElement.ValueKind is not JsonValueKind.Object)
                {
                    continue;
                }

                if (propertiesElement.TryGetProperty("privateIPAddress", out JsonElement privateIpElement)
                    && privateIpElement.ValueKind is JsonValueKind.String
                    && string.Equals(privateIpElement.GetString(), ipAddress, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private static string ReadArmId(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
        {
            return armId;
        }

        return node.SourceId ?? node.NodeId;
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
