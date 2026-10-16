using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resolves backend parent ARM ids from stored load balancer pool JSON (NR-39 CustomerScript + hosted).</summary>
public static class AzureInventoryLoadBalancerBackendParentArmIdResolver
{
    public static IReadOnlyList<string> ResolveFromBackendAddressPoolsJson(string? backendAddressPoolsJson)
    {
        if (string.IsNullOrWhiteSpace(backendAddressPoolsJson))
        {
            return [];
        }

        List<string> parentArmIds = [];
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);

        try
        {
            using JsonDocument document = JsonDocument.Parse(backendAddressPoolsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return parentArmIds;
            }

            foreach (JsonElement pool in document.RootElement.EnumerateArray())
            {
                if (!pool.TryGetProperty("properties", out JsonElement properties)
                    || properties.ValueKind is not JsonValueKind.Object)
                {
                    continue;
                }

                AddFromIpConfigurationCollection(parentArmIds, seen, properties, "backendIPConfigurations", nestedAddress: false);
                AddFromIpConfigurationCollection(parentArmIds, seen, properties, "loadBalancerBackendAddresses", nestedAddress: true);
            }
        }
        catch (JsonException)
        {
            return parentArmIds;
        }

        return parentArmIds;
    }

    private static void AddFromIpConfigurationCollection(
        List<string> parentArmIds,
        HashSet<string> seen,
        JsonElement poolProperties,
        string collectionName,
        bool nestedAddress)
    {
        if (!poolProperties.TryGetProperty(collectionName, out JsonElement configurations)
            || configurations.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement configuration in configurations.EnumerateArray())
        {
            string? ipConfigurationId = nestedAddress
                ? TryReadNestedNetworkInterfaceIpConfigurationId(configuration)
                : TryReadDirectId(configuration);

            if (string.IsNullOrWhiteSpace(ipConfigurationId))
            {
                continue;
            }

            string? parentArmId = AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(ipConfigurationId);

            if (string.IsNullOrWhiteSpace(parentArmId))
            {
                continue;
            }

            string normalized = ArmResourceIdNormalizer.Normalize(parentArmId);

            if (seen.Add(normalized))
            {
                parentArmIds.Add(normalized);
            }
        }
    }

    private static string? TryReadDirectId(JsonElement configuration)
    {
        if (!configuration.TryGetProperty("id", out JsonElement idElement)
            || idElement.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        return idElement.GetString();
    }

    private static string? TryReadNestedNetworkInterfaceIpConfigurationId(JsonElement address)
    {
        if (!address.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object
            || !properties.TryGetProperty("networkInterfaceIPConfiguration", out JsonElement reference))
        {
            return null;
        }

        if (reference.ValueKind is JsonValueKind.String)
        {
            return reference.GetString();
        }

        return TryReadDirectId(reference);
    }
}
