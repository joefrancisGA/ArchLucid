using System.Text.Json;

namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary>UTF-8 JSON wire format for <see cref="GraphProjectionCacheInvalidationMessage" /> pub/sub payloads.</summary>
public static class GraphProjectionCacheInvalidationMessageSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static byte[] Serialize(GraphProjectionCacheInvalidationMessage message)
    {
        ArgumentNullException.ThrowIfNull(message);

        return JsonSerializer.SerializeToUtf8Bytes(message, JsonOptions);
    }

    public static GraphProjectionCacheInvalidationMessage? Deserialize(ReadOnlySpan<byte> payload)
    {
        if (payload.Length == 0)
            return null;

        try
        {
            return JsonSerializer.Deserialize<GraphProjectionCacheInvalidationMessage>(payload, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
