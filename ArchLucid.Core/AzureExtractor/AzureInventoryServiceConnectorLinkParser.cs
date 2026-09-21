using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>service-connector-links.json</c> companion rows (AX-DE-17).
/// </summary>
public static class AzureInventoryServiceConnectorLinkParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryServiceConnectorLinkRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Service Connector link row must be a JSON object.";

            return false;
        }

        string? sourceResourceId = TryReadBoundedString(element, "sourceResourceId", MaxIdentifierLength);
        string? linkerName = TryReadBoundedString(element, "linkerName", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(sourceResourceId)
            || string.IsNullOrWhiteSpace(linkerName)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "sourceResourceId, linkerName, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        row = new AzureInventoryServiceConnectorLinkRow
        {
            SourceResourceId = sourceResourceId.Trim(),
            LinkerName = linkerName.Trim(),
            LinkerResourceId = TryReadBoundedString(element, "linkerResourceId", MaxIdentifierLength),
            TargetResourceId = TryReadBoundedString(element, "targetResourceId", MaxIdentifierLength),
            CollectionStatus = collectionStatus.Trim(),
            WarningCode = TryReadBoundedString(element, "warningCode", MaxNameLength),
        };

        return true;
    }

    private static string? TryReadBoundedString(JsonElement element, string propertyName, int maxLength)
    {
        string? value = TryReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > maxLength)
        {
            trimmed = trimmed[..maxLength];
        }

        return trimmed;
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
