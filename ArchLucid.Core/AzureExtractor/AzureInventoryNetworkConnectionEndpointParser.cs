using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads cited ARM endpoint ids from flattened <c>Microsoft.Network/connections</c> properties (NR-01).
/// </summary>
public static class AzureInventoryNetworkConnectionEndpointParser
{
    private static readonly string[] Endpoint1PropertyKeys =
    [
        "virtualNetworkGateway1.id",
        "virtualNetworkGateway1",
        "expressRouteCircuit.id",
        "expressRouteCircuit",
        "peer.id",
        "peer",
    ];

    private static readonly string[] Endpoint2PropertyKeys =
    [
        "virtualNetworkGateway2.id",
        "virtualNetworkGateway2",
        "localNetworkGateway2.id",
        "localNetworkGateway2",
        "remoteVirtualNetwork.id",
        "remoteVirtualNetwork",
    ];

    public static AzureInventoryNetworkConnectionEndpointParseResult Parse(
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        string? connectionType = TryReadProperty(properties, "connectionType");
        string? endpoint1 = ReadFirstEndpoint(properties, Endpoint1PropertyKeys);
        string? endpoint2 = ReadFirstEndpoint(properties, Endpoint2PropertyKeys);

        return new AzureInventoryNetworkConnectionEndpointParseResult
        {
            ConnectionType = connectionType,
            Endpoint1ArmId = NormalizeArmId(endpoint1),
            Endpoint2ArmId = NormalizeArmId(endpoint2),
        };
    }

    private static string? ReadFirstEndpoint(
        IReadOnlyDictionary<string, string> properties,
        string[] propertyKeys)
    {
        foreach (string propertyKey in propertyKeys)
        {
            string? value = TryReadProperty(properties, propertyKey);

            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }

    private static string? TryReadProperty(IReadOnlyDictionary<string, string> properties, string propertyKey)
    {
        if (!properties.TryGetValue(propertyKey, out string? value) || string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string? NormalizeArmId(string? armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return null;
        }

        if (!armId.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(armId);
    }
}
