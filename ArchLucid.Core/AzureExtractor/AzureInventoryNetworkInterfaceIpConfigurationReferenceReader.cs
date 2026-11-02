using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

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
            return NormalizeReferenceArmId(reference.GetString());
        }

        return TryReadDirectId(reference);
    }

    private static string? TryReadDirectId(JsonElement configuration)
    {
        if (configuration.ValueKind is JsonValueKind.String)
        {
            return NormalizeReferenceArmId(configuration.GetString());
        }

        if (TryGetPropertyIgnoreCase(configuration, "id", out JsonElement idElement))
        {
            return TryReadArmId(idElement);
        }

        return null;
    }

    private static string? NormalizeReferenceArmId(string? armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return null;
        }

        string trimmed = armId.Trim();

        if (trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadArmIdFromJson(trimmed);
        }

        string working = PercentDecodeBounded.Decode(trimmed);

        if (working.StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadArmIdFromJson(working);
        }

        // Post-decode guard: only normalize values that look like ARM resource IDs.
        // This avoids throwing/altering non-ARM values and keeps behavior consistent across parsers.
        if (!LooksLikeArmResourceId(working))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(working);
    }

    private static string? TryReadArmIdFromJson(string json)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (document.RootElement.ValueKind is not JsonValueKind.Object
                || !TryGetPropertyIgnoreCase(document.RootElement, "id", out JsonElement idElement))
            {
                return null;
            }

            return TryReadArmId(idElement);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool LooksLikeArmResourceId(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        return trimmed.StartsWith("/", StringComparison.Ordinal)
            && trimmed.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase);
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
