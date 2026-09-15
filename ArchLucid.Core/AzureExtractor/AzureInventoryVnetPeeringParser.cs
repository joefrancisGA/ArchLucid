using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses VNet peering ARM ids and nested <c>virtualNetworkPeerings</c> JSON for inventory edges.
/// </summary>
public static class AzureInventoryVnetPeeringParser
{
    public const string PeeringsPropertyKey = "virtualNetworkPeerings";

    public const string RemoteVirtualNetworkIdPropertyKey = "remoteVirtualNetwork.id";

    private const string PeeringArmSegment = "/virtualNetworkPeerings";

    public static bool IsVirtualNetworkResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.EndsWith("/virtualNetworks", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsPeeringResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.EndsWith("/virtualNetworkPeerings", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsPeeringResourceId(string? azureResourceId)
    {
        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        return azureResourceId.Contains(PeeringArmSegment, StringComparison.OrdinalIgnoreCase);
    }

    public static string? TryGetParentVirtualNetworkArmId(string? peeringArmId)
    {
        if (string.IsNullOrWhiteSpace(peeringArmId))
        {
            return null;
        }

        int markerIndex = peeringArmId.IndexOf(PeeringArmSegment, StringComparison.OrdinalIgnoreCase);

        if (markerIndex <= 0)
        {
            return null;
        }

        string parentId = peeringArmId[..markerIndex];

        return string.IsNullOrWhiteSpace(parentId) ? null : parentId;
    }

    public static bool HasRemoteVnetIds(string? peeringsJson)
    {
        return EnumerateRemoteVnetIds(peeringsJson).Count > 0;
    }

    public static IReadOnlyList<string> EnumerateRemoteVnetIds(string? peeringsJson)
    {
        if (string.IsNullOrWhiteSpace(peeringsJson))
        {
            return [];
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(peeringsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return [];
            }

            List<string> remoteVnetIds = [];

            foreach (JsonElement peering in document.RootElement.EnumerateArray())
            {
                string? remoteVnetId = TryReadRemoteVnetId(peering);

                if (string.IsNullOrWhiteSpace(remoteVnetId))
                {
                    continue;
                }

                remoteVnetIds.Add(remoteVnetId);
            }

            return remoteVnetIds;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static string? TryReadRemoteVnetId(JsonElement peering)
    {
        if (peering.ValueKind is JsonValueKind.String)
        {
            return NormalizeArmId(peering.GetString());
        }

        if (peering.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (peering.TryGetProperty("properties", out JsonElement properties)
            && properties.ValueKind is JsonValueKind.Object)
        {
            string? nested = TryReadRemoteVnetIdFromObject(properties);

            if (!string.IsNullOrWhiteSpace(nested))
            {
                return nested;
            }
        }

        return TryReadRemoteVnetIdFromObject(peering);
    }

    public static string? TryReadRemoteVnetIdFromProperties(IReadOnlyDictionary<string, string?> properties)
    {
        if (properties is null)
        {
            return null;
        }

        if (properties.TryGetValue(RemoteVirtualNetworkIdPropertyKey, out string? dotted)
            && !string.IsNullOrWhiteSpace(dotted))
        {
            return NormalizeArmId(dotted);
        }

        if (properties.TryGetValue("remoteVirtualNetwork", out string? blob)
            && !string.IsNullOrWhiteSpace(blob))
        {
            string? fromBlob = TryReadRemoteVnetIdFromJsonBlob(blob);

            if (!string.IsNullOrWhiteSpace(fromBlob))
            {
                return fromBlob;
            }
        }

        return null;
    }

    private static string? TryReadRemoteVnetIdFromJsonBlob(string blob)
    {
        string trimmed = blob.Trim();

        if (trimmed.StartsWith('/'))
        {
            return NormalizeArmId(trimmed);
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);

            return TryReadRemoteVnetId(document.RootElement);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string? TryReadRemoteVnetIdFromObject(JsonElement element)
    {
        if (!element.TryGetProperty("remoteVirtualNetwork", out JsonElement remote))
        {
            return null;
        }

        if (remote.ValueKind is JsonValueKind.String)
        {
            return NormalizeArmId(remote.GetString());
        }

        if (remote.ValueKind is JsonValueKind.Object
            && remote.TryGetProperty("id", out JsonElement idElement)
            && idElement.ValueKind is JsonValueKind.String)
        {
            return NormalizeArmId(idElement.GetString());
        }

        return null;
    }

    private static string? NormalizeArmId(string? azureResourceId)
    {
        string normalized = ArmResourceIdNormalizer.Normalize(azureResourceId);

        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
