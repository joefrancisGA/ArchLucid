using System.Globalization;
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

                    continue;
                }

                if (TryNormalizeBooleanString(normalized[key], out string? coerced))
                {
                    normalized[key] = coerced!;

                    continue;
                }

                if (TryParseWholeNumberLongString(normalized[key], out long numericFromString))
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

                    if (TryNormalizeBooleanString(raw, out string? coerced))
                    {
                        result[property.Name] = coerced!;
                    }
                    else if (TryParseWholeNumberLongString(raw, out long numericFromString))
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
                    result[property.Name] = TryReadWholeNumberLongToken(property.Value)
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

                if (el.ValueKind is JsonValueKind.True or JsonValueKind.False)
                    return el.ValueKind == JsonValueKind.True ? 1.0 : 0.0;

                if (el.ValueKind == JsonValueKind.String)
                {
                    string? raw = el.GetString();

                    if (!string.IsNullOrWhiteSpace(raw))
                    {
                        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase))
                            return 1.0;

                        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase))
                            return 0.0;

                        if (double.TryParse(raw, out double parsed))
                            return parsed;
                    }
                }
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
            string? raw = element.GetString();

            if (TryNormalizeBooleanString(raw, out string? normalized))
            {
                value = normalized;

                return true;
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberLongString(raw.Trim(), out long numericFromString))
            {
                value = numericFromString.ToString(CultureInfo.InvariantCulture);

                return true;
            }

            value = raw;

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            value = TryReadWholeNumberLongToken(element);

            return value is not null;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return true;
        }

        value = null;

        return false;
    }

    private static string? TryReadWholeNumberLongToken(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Number)
        {
            return null;
        }

        if (element.TryGetInt64(out long numeric))
        {
            return numeric.ToString(CultureInfo.InvariantCulture);
        }

        if (element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
        {
            return ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);
        }

        return element.GetRawText();
    }

    private static bool TryNormalizeBooleanString(string? raw, out string? value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = null;

            return false;
        }

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            value = "true";

            return true;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            value = "false";

            return true;
        }

        value = null;

        return false;
    }

    private static bool TryParseWholeNumberLongString(string? raw, out long value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (long.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (long)numeric;

            return true;
        }

        value = default;

        return false;
    }
}
