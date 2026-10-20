using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads linked-backend ARM ids from Static Web App child resources (NR-42).
/// </summary>
public static class AzureInventoryStaticSiteLinkedBackendParser
{
    public static string? TryReadBackendResourceId(JsonElement linkedBackendElement)
    {
        if (linkedBackendElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (linkedBackendElement.TryGetProperty("properties", out JsonElement properties)
            && properties.ValueKind is JsonValueKind.Object)
        {
            string? fromProperties = TryReadString(properties, "resourceId")
                                       ?? TryReadString(properties, "backendResourceId");

            if (!string.IsNullOrWhiteSpace(fromProperties))
            {
                return ArmResourceIdNormalizer.Normalize(fromProperties.Trim());
            }
        }

        string? fromId = TryReadString(linkedBackendElement, "id");

        if (!string.IsNullOrWhiteSpace(fromId)
            && fromId.Contains("/providers/", StringComparison.OrdinalIgnoreCase)
            && !fromId.Contains("/linkedBackends/", StringComparison.OrdinalIgnoreCase))
        {
            return ArmResourceIdNormalizer.Normalize(fromId.Trim());
        }

        return null;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : null;
    }
}
