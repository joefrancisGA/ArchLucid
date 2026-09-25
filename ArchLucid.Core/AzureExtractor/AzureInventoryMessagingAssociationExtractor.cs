using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts messaging child rows from Event Hub and Service Bus ARM payloads (AX-DE-13).
/// </summary>
public static class AzureInventoryMessagingAssociationExtractor
{
    public static bool TryExtractEventHub(
        string namespaceResourceId,
        JsonElement eventHubResource,
        out AzureInventoryMessagingAssociationRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(namespaceResourceId)
            || eventHubResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? childResourceId = TryReadString(eventHubResource, "id");
        string? childName = TryReadString(eventHubResource, "name");

        if (string.IsNullOrWhiteSpace(childResourceId) || string.IsNullOrWhiteSpace(childName))
        {
            return false;
        }

        string? captureStorageAccountId = null;

        if (eventHubResource.TryGetProperty("properties", out JsonElement propertiesElement)
            && propertiesElement.ValueKind is JsonValueKind.Object
            && propertiesElement.TryGetProperty("captureDescription", out JsonElement captureElement)
            && captureElement.ValueKind is JsonValueKind.Object
            && IsEnabled(captureElement)
            && captureElement.TryGetProperty("destination", out JsonElement destinationElement)
            && destinationElement.ValueKind is JsonValueKind.Object)
        {
            captureStorageAccountId = TryReadString(destinationElement, "storageAccountResourceId");
        }

        row = new AzureInventoryMessagingAssociationRow
        {
            ParentResourceId = namespaceResourceId.Trim(),
            ChildResourceId = childResourceId.Trim(),
            ChildName = childName.Trim(),
            ChildType = AzureInventoryMessagingAssociationTypes.EventHub,
            AssociationType = AzureInventoryMessagingAssociationTypes.MessagingChild,
            CaptureStorageAccountId = string.IsNullOrWhiteSpace(captureStorageAccountId) ? null : captureStorageAccountId.Trim(),
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    public static bool TryExtractServiceBusChild(
        string namespaceResourceId,
        JsonElement childResource,
        string childType,
        out AzureInventoryMessagingAssociationRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(namespaceResourceId)
            || childResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? childResourceId = TryReadString(childResource, "id");
        string? childName = TryReadString(childResource, "name");

        if (string.IsNullOrWhiteSpace(childResourceId) || string.IsNullOrWhiteSpace(childName))
        {
            return false;
        }

        string? forwardToName = null;
        string? forwardDeadLetteredMessagesToName = null;

        if (childResource.TryGetProperty("properties", out JsonElement propertiesElement)
            && propertiesElement.ValueKind is JsonValueKind.Object)
        {
            forwardToName = TryReadString(propertiesElement, "forwardTo");
            forwardDeadLetteredMessagesToName = TryReadString(
                propertiesElement,
                "forwardDeadLetteredMessagesTo");
        }

        row = new AzureInventoryMessagingAssociationRow
        {
            ParentResourceId = namespaceResourceId.Trim(),
            ChildResourceId = childResourceId.Trim(),
            ChildName = childName.Trim(),
            ChildType = childType,
            AssociationType = AzureInventoryMessagingAssociationTypes.MessagingChild,
            ForwardToName = string.IsNullOrWhiteSpace(forwardToName) ? null : forwardToName.Trim(),
            ForwardDeadLetteredMessagesToName = string.IsNullOrWhiteSpace(forwardDeadLetteredMessagesToName)
                ? null
                : forwardDeadLetteredMessagesToName.Trim(),
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

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }

    private static bool IsEnabled(JsonElement captureElement)
    {
        if (!captureElement.TryGetProperty("enabled", out JsonElement enabledElement))
        {
            return true;
        }

        return enabledElement.ValueKind is JsonValueKind.True;
    }
}
