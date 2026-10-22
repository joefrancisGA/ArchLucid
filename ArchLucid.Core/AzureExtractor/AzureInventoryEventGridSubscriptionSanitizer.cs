using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Converts ARM Event Grid subscription payloads into normalized companion rows (AX-DE-11).
/// </summary>
public static class AzureInventoryEventGridSubscriptionSanitizer
{
    public static bool TrySanitizeFromArmResource(
        string sourceResourceId,
        JsonElement subscriptionResource,
        out AzureInventoryEventGridSubscriptionRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(sourceResourceId)
            || subscriptionResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? subscriptionName = TryReadString(subscriptionResource, "name");
        string? subscriptionResourceId = TryReadString(subscriptionResource, "id");

        if (string.IsNullOrWhiteSpace(subscriptionName))
        {
            return false;
        }

        if (!subscriptionResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        (
            string destinationKind,
            string? destinationResourceId,
            string? destinationHost,
            string? warningCode) = AzureInventoryEventGridDestinationExtractor.Extract(propertiesElement);

        row = new AzureInventoryEventGridSubscriptionRow
        {
            SourceResourceId = sourceResourceId.Trim(),
            SubscriptionName = subscriptionName.Trim(),
            SubscriptionResourceId = string.IsNullOrWhiteSpace(subscriptionResourceId) ? null : subscriptionResourceId.Trim(),
            DestinationResourceId = destinationResourceId,
            DestinationHost = destinationHost,
            DestinationKind = destinationKind,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            WarningCode = warningCode,
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
