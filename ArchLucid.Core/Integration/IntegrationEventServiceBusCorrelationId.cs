using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Core.Integration;

/// <summary>Resolves logical correlation ids for integration event Service Bus publish.</summary>
public static class IntegrationEventServiceBusCorrelationId
{
    /// <summary>Azure Service Bus correlation id max length.</summary>
    public const int MaxLength = 128;

    /// <summary>
    ///     Prefers <see cref="ActivityCorrelation.LogicalCorrelationIdTag" /> on the current activity chain;
    ///     otherwise reads camelCase <c>correlationId</c> from the JSON payload when present.
    /// </summary>
    public static string? TryResolveForPublish(ReadOnlyMemory<byte> payloadUtf8)
    {
        string? fromActivity = ActivityCorrelation.FindTagValueInChain(
            Activity.Current,
            ActivityCorrelation.LogicalCorrelationIdTag);

        if (!string.IsNullOrWhiteSpace(fromActivity))
            return Trim(fromActivity);

        return TryResolveFromPayload(payloadUtf8);
    }

    /// <summary>Truncates to <see cref="MaxLength" /> (Service Bus limit).</summary>
    public static string Trim(string correlationId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(correlationId);

        string trimmed = correlationId.Trim();

        return trimmed.Length <= MaxLength ? trimmed : trimmed[..MaxLength];
    }

    private static string? TryResolveFromPayload(ReadOnlyMemory<byte> payloadUtf8)
    {
        if (payloadUtf8.IsEmpty)
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(payloadUtf8);

            if (!doc.RootElement.TryGetProperty("correlationId", out JsonElement correlationEl))
                return null;

            string? correlationId = correlationEl.GetString();

            if (string.IsNullOrWhiteSpace(correlationId))
                return null;

            return Trim(correlationId);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
