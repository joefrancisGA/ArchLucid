using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Collects known IPv4 addresses and CIDR prefixes for a data-flow connector endpoint (NR-09).
/// </summary>
public static class InventoryDiagramDataFlowNsgEndpointAddressResolver
{
    public sealed class EndpointAddressSet
    {
        public IReadOnlyList<string> IpAddresses
        {
            get;
            init;
        } = [];

        public IReadOnlyList<string> CidrPrefixes
        {
            get;
            init;
        } = [];
    }

    public static EndpointAddressSet Resolve(
        GraphSnapshot graph,
        GraphNode endpointNode,
        GraphNode? peerNode)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(endpointNode);

        HashSet<string> ipAddresses = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> cidrPrefixes = new(StringComparer.OrdinalIgnoreCase);

        CollectFromProperties(endpointNode.Properties, ipAddresses, cidrPrefixes);

        if (IsVirtualMachineNode(endpointNode))
        {
            GraphNode? facingNicNode =
                InventoryDiagramDataFlowNsgAttachmentIndex.ResolveFacingNicForVm(graph, endpointNode, peerNode);

            if (facingNicNode is not null)
            {
                CollectFromProperties(facingNicNode.Properties, ipAddresses, cidrPrefixes);
                CollectSubnetAddresses(graph, facingNicNode, ipAddresses, cidrPrefixes);
            }
        }
        else
        {
            CollectSubnetAddresses(graph, endpointNode, ipAddresses, cidrPrefixes);
        }

        return new EndpointAddressSet
        {
            IpAddresses = ipAddresses.ToList(),
            CidrPrefixes = cidrPrefixes.ToList(),
        };
    }

    private static void CollectSubnetAddresses(
        GraphSnapshot graph,
        GraphNode endpointNode,
        HashSet<string> ipAddresses,
        HashSet<string> cidrPrefixes)
    {
        string? subnetArmId = InventoryDiagramDataFlowNsgAttachmentIndex.ResolveSubnetArmIdForGraphNode(
            graph,
            endpointNode);

        if (string.IsNullOrWhiteSpace(subnetArmId))
        {
            return;
        }

        GraphNode? subnetNode = graph.Nodes.FirstOrDefault(node =>
            node.Properties.TryGetValue("arm.id", out string? armId)
            && string.Equals(
                ArmResourceIdNormalizer.Normalize(armId),
                ArmResourceIdNormalizer.Normalize(subnetArmId),
                StringComparison.OrdinalIgnoreCase));

        if (subnetNode is not null)
        {
            CollectFromProperties(subnetNode.Properties, ipAddresses, cidrPrefixes);
        }
    }

    private static void CollectFromProperties(
        IReadOnlyDictionary<string, string> properties,
        HashSet<string> ipAddresses,
        HashSet<string> cidrPrefixes)
    {
        AddIpAddress(properties, "privateIPAddress", ipAddresses);
        AddIpAddress(properties, "ipAddress", ipAddresses);
        AddCidrPrefix(properties, "addressPrefix", cidrPrefixes);
        AddCidrPrefixes(properties, "addressPrefixes", cidrPrefixes);
        AddPrivateIpAddressesFromIpConfigurations(properties, ipAddresses);
    }

    private static void AddIpAddress(
        IReadOnlyDictionary<string, string> properties,
        string propertyKey,
        HashSet<string> ipAddresses)
    {
        if (!properties.TryGetValue(propertyKey, out string? value)
            || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        string trimmed = value.Trim();

        if (InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp(trimmed)
            && !trimmed.Contains('/', StringComparison.Ordinal))
        {
            ipAddresses.Add(trimmed);
        }
    }

    private static void AddCidrPrefix(
        IReadOnlyDictionary<string, string> properties,
        string propertyKey,
        HashSet<string> cidrPrefixes)
    {
        if (!properties.TryGetValue(propertyKey, out string? value)
            || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        string trimmed = value.Trim();

        if (InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp(trimmed))
        {
            cidrPrefixes.Add(trimmed);
        }
    }

    private static void AddCidrPrefixes(
        IReadOnlyDictionary<string, string> properties,
        string propertyKey,
        HashSet<string> cidrPrefixes)
    {
        if (!properties.TryGetValue(propertyKey, out string? value)
            || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        foreach (string prefix in ParseStringArray(value))
        {
            if (InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp(prefix))
            {
                cidrPrefixes.Add(prefix);
            }
        }
    }

    private static void AddPrivateIpAddressesFromIpConfigurations(
        IReadOnlyDictionary<string, string> properties,
        HashSet<string> ipAddresses)
    {
        if (!properties.TryGetValue("ipConfigurations", out string? ipConfigurationsJson)
            || string.IsNullOrWhiteSpace(ipConfigurationsJson))
        {
            return;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(ipConfigurationsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return;
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
                    && !string.IsNullOrWhiteSpace(privateIpElement.GetString()))
                {
                    ipAddresses.Add(privateIpElement.GetString()!.Trim());
                }
            }
        }
        catch (JsonException)
        {
        }
    }

    private static IEnumerable<string> ParseStringArray(string rawValue)
    {
        string trimmed = rawValue.Trim();

        if (trimmed.StartsWith("[", StringComparison.Ordinal))
        {
            List<string>? parsedJsonArray = TryParseJsonStringArray(trimmed);

            if (parsedJsonArray is not null)
            {
                return parsedJsonArray;
            }
        }

        return trimmed.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(part => !string.IsNullOrWhiteSpace(part));
    }

    private static List<string>? TryParseJsonStringArray(string trimmed)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return null;
            }

            List<string> values = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (element.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(element.GetString()))
                {
                    values.Add(element.GetString()!.Trim());
                }
            }

            return values;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool IsVirtualMachineNode(GraphNode graphNode)
    {
        if (graphNode.Properties.TryGetValue("arm.type", out string? armType)
            && !string.IsNullOrWhiteSpace(armType))
        {
            return armType.Contains("/virtualMachines", StringComparison.OrdinalIgnoreCase);
        }

        return graphNode.NodeType.Contains("/virtualMachines", StringComparison.OrdinalIgnoreCase);
    }
}
