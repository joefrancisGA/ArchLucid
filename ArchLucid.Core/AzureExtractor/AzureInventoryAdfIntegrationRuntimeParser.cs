using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>adf-integration-runtimes.json</c> companion rows.
/// </summary>
public static class AzureInventoryAdfIntegrationRuntimeParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryAdfIntegrationRuntimeRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "ADF integration runtime row must be a JSON object.";

            return false;
        }

        string? factoryResourceId = TryReadBoundedString(element, "factoryResourceId", MaxIdentifierLength);
        string? integrationRuntimeResourceId = TryReadBoundedString(element, "integrationRuntimeResourceId", MaxIdentifierLength);
        string? name = TryReadBoundedString(element, "name", MaxNameLength);
        string? kind = TryReadBoundedString(element, "kind", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || string.IsNullOrWhiteSpace(integrationRuntimeResourceId)
            || string.IsNullOrWhiteSpace(name)
            || string.IsNullOrWhiteSpace(kind)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "factoryResourceId, integrationRuntimeResourceId, name, kind, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        row = new AzureInventoryAdfIntegrationRuntimeRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            IntegrationRuntimeResourceId = integrationRuntimeResourceId.Trim(),
            Name = name.Trim(),
            Kind = kind.Trim(),
            SubnetId = TryReadBoundedString(element, "subnetId", MaxIdentifierLength),
            State = TryReadBoundedString(element, "state", MaxNameLength),
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
