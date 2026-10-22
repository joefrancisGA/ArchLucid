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
            JsonElement poolsRoot = document.RootElement;

            if (poolsRoot.ValueKind is JsonValueKind.String)
            {
                string? nestedPoolsJson = poolsRoot.GetString();

                if (string.IsNullOrWhiteSpace(nestedPoolsJson))
                {
                    return parentArmIds;
                }

                return ResolveFromBackendAddressPoolsJson(nestedPoolsJson);
            }

            if (!AzureExtractorJsonArrayRoot.TryCloneRows(poolsRoot, out JsonElement[] pools))
            {
                return parentArmIds;
            }

            foreach (JsonElement pool in pools)
            {
                if (!TryGetBackendAddressPoolPropertiesBag(pool, out JsonElement properties))
                {
                    continue;
                }

                AddFromIpConfigurationCollection(parentArmIds, seen, properties, "backendIPConfigurations", nestedAddress: false);
                AddFromIpConfigurationCollection(parentArmIds, seen, properties, "loadBalancerBackendAddresses", nestedAddress: true);
                AddFromApplicationGatewayBackendAddresses(parentArmIds, seen, properties);
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
        if (!TryGetPropertyIgnoreCase(poolProperties, collectionName, out JsonElement configurations)
            || configurations.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement configuration in configurations.EnumerateArray())
        {

            if (!AzureExtractorJsonObjectElement.TryResolveCollectionElement(configuration, nestedAddress, out JsonElement configurationElement))
            {
                continue;
            }

            string? ipConfigurationId = nestedAddress
                ? TryReadNestedNetworkInterfaceIpConfigurationId(configurationElement)
                : TryReadDirectId(configurationElement);

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

    private static void AddFromApplicationGatewayBackendAddresses(
        List<string> parentArmIds,
        HashSet<string> seen,
        JsonElement poolProperties)
    {
        if (!TryGetPropertyIgnoreCase(poolProperties, "backendAddresses", out JsonElement addresses)
            || addresses.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement address in addresses.EnumerateArray())
        {
            string? backendArmId = AzureInventoryApplicationGatewayBackendAddressReader.TryReadBackendResourceArmId(address);

            if (string.IsNullOrWhiteSpace(backendArmId))
            {
                continue;
            }

            string normalized = ArmResourceIdNormalizer.Normalize(backendArmId);

            if (seen.Add(normalized))
            {
                parentArmIds.Add(normalized);
            }
        }
    }

    private static bool TryGetBackendAddressPoolPropertiesBag(JsonElement pool, out JsonElement poolProperties)
    {
        if (!AzureExtractorJsonObjectElement.TryUnwrapObject(pool, out JsonElement poolElement))
        {
            poolProperties = default;

            return false;
        }

        if (TryGetPropertyIgnoreCase(poolElement, "properties", out JsonElement nested)
            && nested.ValueKind is JsonValueKind.Object)
        {
            poolProperties = nested;

            return true;
        }

        if (poolElement.ValueKind is JsonValueKind.Object
            && (TryGetPropertyIgnoreCase(poolElement, "backendIPConfigurations", out _)
                || TryGetPropertyIgnoreCase(poolElement, "loadBalancerBackendAddresses", out _)
                || TryGetPropertyIgnoreCase(poolElement, "backendAddresses", out _)))
        {
            poolProperties = poolElement;

            return true;
        }

        poolProperties = default;

        return false;
    }

    private static string? TryReadDirectId(JsonElement configuration)
    {
        return AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(configuration);
    }

    private static string? TryReadNestedNetworkInterfaceIpConfigurationId(JsonElement address)
    {

        if (address.ValueKind is JsonValueKind.String)
        {
            return TryReadNetworkInterfaceIpConfigurationReference(address);
        }

        if (TryGetPropertyIgnoreCase(address, "properties", out JsonElement properties)
            && properties.ValueKind is JsonValueKind.Object
            && TryGetPropertyIgnoreCase(properties, "networkInterfaceIPConfiguration", out JsonElement nestedReference))
        {
            return TryReadNetworkInterfaceIpConfigurationReference(nestedReference);
        }

        if (TryGetPropertyIgnoreCase(address, "networkInterfaceIPConfiguration", out JsonElement flatReference))
        {
            return TryReadNetworkInterfaceIpConfigurationReference(flatReference);
        }

        return null;
    }

    private static string? TryReadNetworkInterfaceIpConfigurationReference(JsonElement reference)
    {
        return AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(reference);
    }

    private static bool TryGetPropertyIgnoreCase(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {

            if (!property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
