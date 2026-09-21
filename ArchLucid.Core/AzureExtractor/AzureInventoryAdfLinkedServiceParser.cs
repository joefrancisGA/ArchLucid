using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>adf-linked-services.json</c> companion rows.
/// </summary>
public static class AzureInventoryAdfLinkedServiceParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    private const int MaxHostLength = 253;

    public static bool TryParse(JsonElement element, out AzureInventoryAdfLinkedServiceRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "ADF linked-service row must be a JSON object.";

            return false;
        }

        string? factoryResourceId = TryReadBoundedString(element, "factoryResourceId", MaxIdentifierLength);
        string? linkedServiceResourceId = TryReadBoundedString(element, "linkedServiceResourceId", MaxIdentifierLength);
        string? linkedServiceName = TryReadBoundedString(element, "linkedServiceName", MaxNameLength);
        string? linkedServiceType = TryReadBoundedString(element, "linkedServiceType", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || string.IsNullOrWhiteSpace(linkedServiceResourceId)
            || string.IsNullOrWhiteSpace(linkedServiceName)
            || string.IsNullOrWhiteSpace(linkedServiceType)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "factoryResourceId, linkedServiceResourceId, linkedServiceName, linkedServiceType, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        row = new AzureInventoryAdfLinkedServiceRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            LinkedServiceResourceId = linkedServiceResourceId.Trim(),
            LinkedServiceName = linkedServiceName.Trim(),
            LinkedServiceType = linkedServiceType.Trim(),
            TargetResourceId = TryReadBoundedString(element, "targetResourceId", MaxIdentifierLength),
            TargetHost = TryReadBoundedString(element, "targetHost", MaxHostLength),
            KeyVaultResourceId = TryReadBoundedString(element, "keyVaultResourceId", MaxIdentifierLength),
            IntegrationRuntimeName = TryReadBoundedString(element, "integrationRuntimeName", MaxNameLength),
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
