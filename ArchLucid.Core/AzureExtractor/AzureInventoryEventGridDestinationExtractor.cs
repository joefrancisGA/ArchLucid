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
            string? endpointUrl = AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "endpointUrl")
                                  ?? AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "endpointBaseUrl");
            string? host = AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointUrl);

            if (string.IsNullOrWhiteSpace(host))
            {
                return (destinationKind, null, null, "eventgrid-webhook-host-only");
            }

            return (destinationKind, null, host, null);
        }

        string? resourceId = AzureInventoryArmNestedObjectPropertyReader.TryReadString(destinationElement, "resourceId");

        if (!string.IsNullOrWhiteSpace(resourceId))
        {
            return (destinationKind, resourceId.Trim(), null, null);
        }

        return (destinationKind, null, null, null);
    }
}
