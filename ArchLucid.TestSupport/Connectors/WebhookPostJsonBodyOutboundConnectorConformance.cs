using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.TestSupport.Connectors;

/// <summary>Ensures JSON POST bodies for webhooks do not echo destinations or auth material.</summary>
public static class WebhookPostJsonBodyOutboundConnectorConformance
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly string[] ForbiddenBodyMarkers =
    [
        "Bearer ",
        "Basic "
    ];

    public static void AssertBodyJsonDoesNotEchoDestination(
        string connectorName,
        object body,
        string destinationUrl)
    {
        if (string.IsNullOrWhiteSpace(connectorName))
            throw new ArgumentException("connectorName is required.", nameof(connectorName));

        ArgumentNullException.ThrowIfNull(body);

        if (string.IsNullOrWhiteSpace(destinationUrl))
            throw new ArgumentException("destinationUrl is required.", nameof(destinationUrl));

        string json = JsonSerializer.Serialize(body, SerializerOptions);

        json.Should().NotContain(destinationUrl, because: $"{connectorName}: POST JSON must not embed the webhook destination URL.");

        foreach (string forbidden in ForbiddenBodyMarkers)
        {
            json.Should().NotContain(forbidden, because: $"{connectorName}: POST JSON must not echo `{forbidden}`.");
        }
    }
}
