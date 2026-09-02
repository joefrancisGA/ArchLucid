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
            Dictionary<string, string> normalized =
                new Dictionary<string, string>(deserialized, StringComparer.OrdinalIgnoreCase);

            foreach (string key in normalized.Keys.ToList())
            {
                if (normalized[key] is null)
                {
                    normalized[key] = string.Empty;
                }
            }

            return normalized;
#pragma warning restore IDE0028 // Simplify collection initialization
        }
        catch (JsonException)
        {
            Dictionary<string, string> result = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonProperty property in propsEl.EnumerateObject())
            {
                if (property.Value.ValueKind == JsonValueKind.Null)
                {
                    result[property.Name] = string.Empty;

                    continue;
                }

                if (property.Value.ValueKind == JsonValueKind.String)
                {
                    result[property.Name] = property.Value.GetString() ?? "";

                    continue;
                }

                if (property.Value.ValueKind == JsonValueKind.Number)
                {
                    result[property.Name] = property.Value.GetRawText();
                }

                if (property.Value.ValueKind is JsonValueKind.True or JsonValueKind.False)
                {
                    result[property.Name] = property.Value.GetRawText();
                }
            }

            return result;
        }
    }

    public static string? ReadFirstString(JsonElement root, params string[] names)
    {
        foreach (string name in names)

            if (TryGetIgnoreCase(root, name, out JsonElement el) && TryReadStringToken(el, out string? value))
                return value;

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

    private static bool TryReadStringToken(JsonElement element, out string? value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            value = element.GetString();

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            value = element.GetRawText();

            return true;
        }

        value = null;

        return false;
    }
}
