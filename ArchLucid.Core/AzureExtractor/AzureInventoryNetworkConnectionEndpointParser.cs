using System.Text.Json;

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

        return new AzureInventoryNetworkConnectionEndpointParseResult
        {
            ConnectionType = TryReadProperty(properties, "connectionType"),
            Endpoint1ArmId = ReadFirstEndpointArmId(properties, Endpoint1PropertyKeys),
            Endpoint2ArmId = ReadFirstEndpointArmId(properties, Endpoint2PropertyKeys),
        };
    }

    private static string? ReadFirstEndpointArmId(
        IReadOnlyDictionary<string, string> properties,
        string[] propertyKeys)
    {
        foreach (string propertyKey in propertyKeys)
        {
            string? armId = NormalizeArmId(TryReadProperty(properties, propertyKey));

            if (!string.IsNullOrWhiteSpace(armId))
            {
                return armId;
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

        string trimmed = armId.Trim();

        string working = trimmed.StartsWith("{", StringComparison.Ordinal)
            ? trimmed
            : PercentDecodeBounded.Decode(trimmed);

        if (working.StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadArmIdFromJson(working);
        }
        if (!working.StartsWith("/", StringComparison.Ordinal)
            || !working.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(working);
    }

    private static string? TryReadArmIdFromJson(string json) =>
        AzureInventoryArmJsonBlobIdReader.TryReadArmIdFromJson(json, NormalizeArmId);
}
