using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>event-grid-subscriptions.json</c> companion rows (AX-DE-11).
/// </summary>
public static class AzureInventoryEventGridSubscriptionParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryEventGridSubscriptionRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Event Grid subscription row must be a JSON object.";

            return false;
        }

        string? sourceResourceId = TryReadBoundedString(element, "sourceResourceId", MaxIdentifierLength);
        string? subscriptionName = TryReadBoundedString(element, "subscriptionName", MaxNameLength);
        string? destinationKind = TryReadBoundedString(element, "destinationKind", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(sourceResourceId)
            || string.IsNullOrWhiteSpace(subscriptionName)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "sourceResourceId, subscriptionName, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        row = new AzureInventoryEventGridSubscriptionRow
        {
            SourceResourceId = sourceResourceId.Trim(),
            SubscriptionName = subscriptionName.Trim(),
            SubscriptionResourceId = TryReadBoundedString(element, "subscriptionResourceId", MaxIdentifierLength),
            DestinationResourceId = TryReadBoundedString(element, "destinationResourceId", MaxIdentifierLength),
            DestinationHost = TryReadBoundedString(element, "destinationHost", MaxNameLength),
            DestinationKind = destinationKind ?? string.Empty,
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
