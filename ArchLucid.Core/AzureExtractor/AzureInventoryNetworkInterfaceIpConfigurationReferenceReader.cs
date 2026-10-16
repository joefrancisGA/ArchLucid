using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads ip configuration ARM ids from nested or flat <c>networkInterfaceIPConfiguration</c> references.
/// </summary>
public static class AzureInventoryNetworkInterfaceIpConfigurationReferenceReader
{
    public static string? TryReadArmId(JsonElement reference)
    {
        if (AzureExtractorJsonObjectElement.TryUnwrapObject(reference, out JsonElement objectReference))
        {
            return TryReadDirectId(objectReference);
        }

        if (reference.ValueKind is JsonValueKind.String)
        {
            return reference.GetString();
        }

        return TryReadDirectId(reference);
    }

    private static string? TryReadDirectId(JsonElement configuration)
    {
        if (configuration.ValueKind is JsonValueKind.String)
        {
            return TryReadArmId(configuration);
        }

        if (TryGetPropertyIgnoreCase(configuration, "id", out JsonElement idElement))
        {
            return TryReadArmId(idElement);
        }

        return null;
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
