using System.Text.Json;

namespace ArchiForge.Persistence.Serialization;

public static class JsonEntitySerializer
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
        Converters =
        {
            new GraphNodeJsonConverter(),
            new GraphEdgeJsonConverter()
        }
    };

    public static string Serialize<T>(T value)
    {
        return JsonSerializer.Serialize(value, Options);
    }

    public static T Deserialize<T>(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            throw new InvalidOperationException("Cannot deserialize empty JSON.");

        T? value;
        try
        {
            value = JsonSerializer.Deserialize<T>(json, Options);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"JSON for {typeof(T).Name} is corrupt and cannot be deserialized.", ex);
        }

        if (value is null)
            throw new InvalidOperationException($"Failed to deserialize {typeof(T).Name}.");

        return value;
    }
}
