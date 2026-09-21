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

        string destinationKind = TryReadString(destinationElement, "endpointType") ?? string.Empty;

        if (destinationKind.Equals("WebHook", StringComparison.OrdinalIgnoreCase))
        {
            string? endpointUrl = TryReadString(destinationElement, "endpointUrl")
                                  ?? TryReadString(destinationElement, "endpointBaseUrl");
            string? host = AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointUrl);

            if (string.IsNullOrWhiteSpace(host))
            {
                return (destinationKind, null, null, "eventgrid-webhook-host-only");
            }

            return (destinationKind, null, host, null);
        }

        string? resourceId = TryReadString(destinationElement, "resourceId");

        if (!string.IsNullOrWhiteSpace(resourceId))
        {
            return (destinationKind, resourceId.Trim(), null, null);
        }

        return (destinationKind, null, null, null);
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
