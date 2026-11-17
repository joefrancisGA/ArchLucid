using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses Event Grid subscription destination metadata from ARM payloads (AX-DE-11).
/// </summary>
public static class AzureInventoryEventGridDestinationExtractor
{
    public static (
        string DestinationKind,
        string? DestinationResourceId,
        string? DestinationHost,
        string? WarningCode) Extract(JsonElement propertiesElement)
    {
        if (propertiesElement.ValueKind is not JsonValueKind.Object
            || !propertiesElement.TryGetProperty("destination", out JsonElement destinationElement)
            || destinationElement.ValueKind is not JsonValueKind.Object)
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
