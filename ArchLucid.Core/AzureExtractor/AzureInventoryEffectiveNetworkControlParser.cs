using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses <c>effective-network-controls.json</c> rows (IE-RF-10).
/// </summary>
public static class AzureInventoryEffectiveNetworkControlParser
{
    public static bool TryParse(
        JsonElement element,
        out AzureInventoryEffectiveNetworkControlRow? row,
        out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        string? nicResourceId = TryReadString(element, "nicResourceId");
        string? kind = TryReadString(element, "kind");
        string? collectionStatus = TryReadString(element, "collectionStatus");

        if (string.IsNullOrWhiteSpace(nicResourceId))
        {
            errorMessage = "nicResourceId is required.";

            return false;
        }

        if (string.IsNullOrWhiteSpace(kind))
        {
            errorMessage = "kind is required.";

            return false;
        }

        if (!kind.Equals(AzureInventoryEffectiveNetworkControlKind.EffectiveNsg, StringComparison.OrdinalIgnoreCase)
            && !kind.Equals(AzureInventoryEffectiveNetworkControlKind.EffectiveRoutes, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = $"Unknown kind '{kind}'.";

            return false;
        }

        if (string.IsNullOrWhiteSpace(collectionStatus))
        {
            collectionStatus = AzureInventoryEffectiveNetworkControlCollectionStatus.Skipped;
        }

        row = new AzureInventoryEffectiveNetworkControlRow
        {
            NicResourceId = nicResourceId.Trim(),
            Kind = kind.Trim(),
            CollectionStatus = collectionStatus.Trim(),
            EffectiveResourceId = TryReadString(element, "effectiveResourceId"),
            PayloadHashSha256 = TryReadString(element, "payloadHashSha256")
                ?? TryReadString(element, "payloadHash"),
        };

        return true;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
