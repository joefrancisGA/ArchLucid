using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses Event Grid subscription destination metadata from ARM payloads (AX-DE-11).
/// </summary>
public static class AzureInventoryEventGridDestinationExtractor
{
    internal static bool TryResolveDestination(JsonElement properties, out JsonElement destination)
    {
        destination = default;
        if (properties.ValueKind != JsonValueKind.Object)
            return false;

        if (properties.TryGetProperty("deliveryWithResourceIdentity", out JsonElement delivery)
            && delivery.ValueKind != JsonValueKind.Null)
        {
            // Do not silently prefer one target when two delivery shapes are supplied.
            if (properties.TryGetProperty("destination", out JsonElement direct)
                && direct.ValueKind != JsonValueKind.Null)
                return false;

            return delivery.ValueKind == JsonValueKind.Object
                && delivery.TryGetProperty("destination", out destination)
                && destination.ValueKind == JsonValueKind.Object;
        }

        return properties.TryGetProperty("destination", out destination)
            && destination.ValueKind == JsonValueKind.Object;
    }

    public static (
        string DestinationKind,
        string? DestinationResourceId,
        string? DestinationHost,
        string? WarningCode) Extract(JsonElement propertiesElement)
    {
        if (!TryResolveDestination(propertiesElement, out JsonElement destinationElement))
        {
            return (string.Empty, null, null, null);
        }

        string destinationKind =
            AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "endpointType") ?? string.Empty;

        if (destinationKind.Equals("WebHook", StringComparison.OrdinalIgnoreCase))
        {
            string? endpointUrl =
                AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "endpointUrl");
            string? endpointBaseUrl =
                AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "endpointBaseUrl");
            string? destinationResourceId =
                AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "resourceId");
            string? host = AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointUrl);

            if (string.IsNullOrWhiteSpace(host))
            {
                host = AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointBaseUrl);
            }

            if (string.IsNullOrWhiteSpace(host))
            {
                return (destinationKind, destinationResourceId?.Trim(), null, "eventgrid-webhook-host-only");
            }

            return (destinationKind, destinationResourceId?.Trim(), host, null);
        }

        string? resourceId = AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "resourceId");

        if (!string.IsNullOrWhiteSpace(resourceId))
        {
            return (destinationKind, resourceId.Trim(), null, null);
        }

        string? eventHubResourceId =
            AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "eventHubResourceId");

        if (!string.IsNullOrWhiteSpace(eventHubResourceId))
        {
            return (destinationKind, eventHubResourceId.Trim(), null, null);
        }

        string? resourceUri =
            AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "resourceUri");

        if (!string.IsNullOrWhiteSpace(resourceUri))
        {
            return (destinationKind, resourceUri.Trim(), null, null);
        }

        return (destinationKind, null, null, null);
    }
}
