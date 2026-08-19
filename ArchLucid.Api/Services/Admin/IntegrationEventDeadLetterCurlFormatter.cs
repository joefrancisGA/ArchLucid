using System.Text;

using ArchLucid.Core.Integration;
using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Builds reproducible cURL commands for dead-lettered integration outbox rows.</summary>
public static class IntegrationEventDeadLetterCurlFormatter
{
    /// <summary>
    ///     Formats a POST replay command. When <paramref name="receiverUrl" /> is unset, uses a placeholder URL with the
    ///     payload embedded for manual substitution.
    /// </summary>
    public static string Format(IntegrationEventOutboxEntry entry, string? receiverUrl)
    {
        ArgumentNullException.ThrowIfNull(entry);

        string payload = Encoding.UTF8.GetString(entry.PayloadUtf8);
        string escapedPayload = payload.Replace("'", "'\\''", StringComparison.Ordinal);
        string targetUrl = string.IsNullOrWhiteSpace(receiverUrl)
            ? "https://YOUR-WEBHOOK-RECEIVER.example/integration-events"
            : receiverUrl.Trim();

        StringBuilder builder = new();
        builder.Append("curl -X POST '").Append(targetUrl).AppendLine("'");
        builder.Append("  -H 'Content-Type: application/cloudevents+json'");
        builder.Append("  -H 'ce-type: ").Append(entry.EventType).AppendLine("'");
        builder.Append("  -H 'ce-id: ").Append(entry.OutboxId.ToString("D")).AppendLine("'");
        builder.Append("  -H 'ce-source: archlucid/integration-outbox'");
        builder.Append("  -d '").Append(escapedPayload).Append('\'');

        return builder.ToString();
    }
}
