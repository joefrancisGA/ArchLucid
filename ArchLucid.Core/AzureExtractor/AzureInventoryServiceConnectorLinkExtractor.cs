using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts Service Connector linker rows from ARM payloads (AX-DE-17).
/// </summary>
public static class AzureInventoryServiceConnectorLinkExtractor
{
    public static bool TryExtract(
        string sourceResourceId,
        JsonElement linkerResource,
        out AzureInventoryServiceConnectorLinkRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(sourceResourceId)
            || linkerResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? linkerResourceId = TryReadString(linkerResource, "id");
        string? linkerName = TryReadString(linkerResource, "name");

        if (string.IsNullOrWhiteSpace(linkerResourceId) || string.IsNullOrWhiteSpace(linkerName))
        {
            return false;
        }

        string? targetResourceId = null;

        if (linkerResource.TryGetProperty("properties", out JsonElement propertiesElement)
            && propertiesElement.ValueKind is JsonValueKind.Object
            && propertiesElement.TryGetProperty("targetService", out JsonElement targetServiceElement)
            && targetServiceElement.ValueKind is JsonValueKind.Object)
        {
            targetResourceId = TryReadString(targetServiceElement, "id");
        }

        row = new AzureInventoryServiceConnectorLinkRow
        {
            SourceResourceId = sourceResourceId.Trim(),
            LinkerName = linkerName.Trim(),
            LinkerResourceId = linkerResourceId.Trim(),
            TargetResourceId = string.IsNullOrWhiteSpace(targetResourceId) ? null : targetResourceId.Trim(),
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
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
