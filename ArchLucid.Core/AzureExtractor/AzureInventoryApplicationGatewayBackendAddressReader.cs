using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads NIC or resource ARM ids from application gateway <c>backendAddresses</c> pool members.
/// </summary>
public static class AzureInventoryApplicationGatewayBackendAddressReader
{
    public static string? TryReadBackendResourceArmId(JsonElement address)
    {
        if (!AzureExtractorJsonObjectElement.TryUnwrapObject(address, out JsonElement addressElement))
        {
            return null;
        }

        if (!TryGetAddressPropertiesBag(addressElement, out JsonElement properties))
        {
            return null;
        }

        if (TryGetPropertyIgnoreCase(properties, "backendIpAddress", out JsonElement ipElement)
            && ipElement.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(ipElement.GetString()))
        {
            return null;
        }

        if (TryGetPropertyIgnoreCase(properties, "backendResourceId", out JsonElement resourceIdElement))
        {
            return AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(resourceIdElement);
        }

        return null;
    }

    private static bool TryGetAddressPropertiesBag(JsonElement address, out JsonElement properties)
    {
        if (TryGetPropertyIgnoreCase(address, "properties", out JsonElement nested)
            && nested.ValueKind is JsonValueKind.Object)
        {
            properties = nested;

            return true;
        }

        if (address.ValueKind is JsonValueKind.Object
            && TryGetPropertyIgnoreCase(address, "backendResourceId", out _))
        {
            properties = address;

            return true;
        }

        properties = default;

        return false;
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
