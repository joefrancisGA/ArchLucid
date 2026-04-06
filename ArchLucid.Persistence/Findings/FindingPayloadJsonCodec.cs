using System.Text.Json;

using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Serialization;

namespace ArchLucid.Persistence.Findings;

/// <summary>
/// Serializes <see cref="ArchLucid.Decisioning.Models.Finding.Payload"/> to/from <c>PayloadJson</c> using the same
/// options as <see cref="FindingJsonConverter"/> so typed payloads round-trip.
/// </summary>
public static class FindingPayloadJsonCodec
{
    private static readonly JsonSerializerOptions Options = FindingsSerialization.CreateOptions();

    public static string? SerializePayload(object? payload)
    {
        if (payload is null)
            return null;

        if (payload is JsonElement element)
            return element.GetRawText();

        return JsonSerializer.Serialize(payload, payload.GetType(), Options);
    }

    public static object? DeserializePayload(string? json, string? payloadType)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        Type? resolved = FindingPayloadRegistry.ResolvePayloadType(payloadType);

        if (resolved is not null)
            return JsonSerializer.Deserialize(json, resolved, Options);

        using JsonDocument document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
