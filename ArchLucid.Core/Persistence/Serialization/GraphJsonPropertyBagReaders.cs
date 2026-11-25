using System.Text.Json;

namespace ArchLucid.Core.Persistence.Serialization;

/// <summary>Properties-bag JSON readers for graph node/edge converters.</summary>
internal static class GraphJsonPropertyBagReaders
{
    public static Dictionary<string, string> ReadProperties(JsonElement root)
    {
        Dictionary<string, string> result = new(StringComparer.OrdinalIgnoreCase);
        if (!GraphJsonScalarReaders.TryGetIgnoreCase(root, "properties", out JsonElement properties)
            || properties.ValueKind != JsonValueKind.Object)
        {
            return result;
        }

        foreach (JsonProperty property in properties.EnumerateObject())
        {
            // Match the legacy mixed-token reader: the last supported value wins for a case-insensitive key.
            if (property.Value.ValueKind == JsonValueKind.Null)
                result[property.Name] = string.Empty;
            else if (GraphJsonScalarReaders.TryReadStringToken(property.Value, out string? value))
                result[property.Name] = value ?? string.Empty;
        }

        return result;
    }
}
