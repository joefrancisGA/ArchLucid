using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Persistence.Serialization;

/// <summary>Properties-bag JSON readers for graph node/edge converters.</summary>
internal static class GraphJsonPropertyBagReaders
{
    public static Dictionary<string, string> ReadProperties(JsonElement root, JsonSerializerOptions options)
    {
        if (!GraphJsonScalarReaders.TryGetIgnoreCase(root, "properties", out JsonElement propsEl) || propsEl.ValueKind != JsonValueKind.Object)
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

                    continue;
                }

                if (GraphJsonScalarReaders.TryNormalizeBooleanString(normalized[key], out string? coerced))
                {
                    normalized[key] = coerced!;

                    continue;
                }

                if (GraphJsonScalarReaders.TryParseWholeNumberLongString(normalized[key], out long numericFromString))
                {
                    normalized[key] = numericFromString.ToString(CultureInfo.InvariantCulture);
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
                    string? raw = property.Value.GetString() ?? "";

                    if (GraphJsonScalarReaders.TryNormalizeBooleanString(raw, out string? coerced))
                    {
                        result[property.Name] = coerced!;
                    }
                    else if (GraphJsonScalarReaders.TryParseWholeNumberLongString(raw, out long numericFromString))
                    {
                        result[property.Name] = numericFromString.ToString(CultureInfo.InvariantCulture);
                    }
                    else
                    {
                        result[property.Name] = raw;
                    }

                    continue;
                }

                if (property.Value.ValueKind == JsonValueKind.Number)
                {
                    result[property.Name] = GraphJsonScalarReaders.TryReadWholeNumberLongToken(property.Value)
                        ?? property.Value.GetRawText();
                }

                if (property.Value.ValueKind is JsonValueKind.True or JsonValueKind.False)
                {
                    result[property.Name] = property.Value.GetRawText();
                }
            }

            return result;
        }
    }
}
