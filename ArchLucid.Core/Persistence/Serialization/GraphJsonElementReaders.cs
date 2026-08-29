using System.Text.Json;

namespace ArchLucid.Core.Persistence.Serialization;

/// <summary>Shared JSON element readers for graph node/edge converters.</summary>
internal static class GraphJsonElementReaders
{
    public static Dictionary<string, string> ReadProperties(JsonElement root, JsonSerializerOptions options)
    {
        if (!TryGetIgnoreCase(root, "properties", out JsonElement propsEl) || propsEl.ValueKind != JsonValueKind.Object)
#pragma warning disable IDE0028 // Simplify collection initialization
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
#pragma warning restore IDE0028 // Simplify collection initialization

        try
        {
            // STJ Dictionary deserialize is case-sensitive; graph property lookups (resourceId, etc.) are ignore-case.
            Dictionary<string, string>? deserialized =
                JsonSerializer.Deserialize<Dictionary<string, string>>(propsEl.GetRawText(), options);

            if (deserialized is null)
#pragma warning disable IDE0028 // Simplify collection initialization
                return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
#pragma warning restore IDE0028 // Simplify collection initialization

#pragma warning disable IDE0028 // Simplify collection initialization
            return new Dictionary<string, string>(deserialized, StringComparer.OrdinalIgnoreCase);
#pragma warning restore IDE0028 // Simplify collection initialization
        }
        catch (JsonException)
        {
            Dictionary<string, string> result = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonProperty property in propsEl.EnumerateObject())
            {
                if (property.Value.ValueKind != JsonValueKind.String)
                    continue;

                result[property.Name] = property.Value.GetString() ?? "";
            }

            return result;
        }
    }

    public static string? ReadFirstString(JsonElement root, params string[] names)
    {
        foreach (string name in names)

            if (TryGetIgnoreCase(root, name, out JsonElement el) && el.ValueKind == JsonValueKind.String)
                return el.GetString();

        return null;
    }

    public static double? ReadFirstDouble(JsonElement root, params string[] names)
    {
        foreach (string name in names)

            if (TryGetIgnoreCase(root, name, out JsonElement el))
            {
                if (el.ValueKind == JsonValueKind.Number && el.TryGetDouble(out double d))
                    return d;

                if (el.ValueKind == JsonValueKind.String && double.TryParse(el.GetString(), out double parsed))
                    return parsed;
            }

        return null;
    }

    public static bool TryGetIgnoreCase(JsonElement obj, string name, out JsonElement value)
    {
        foreach (JsonProperty p in obj.EnumerateObject()
                     .Where(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
        {
            value = p.Value;
            return true;
        }

        value = default;
        return false;
    }
}
