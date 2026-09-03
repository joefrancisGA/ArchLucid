using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Persistence.Serialization;

/// <summary>Scalar JSON element readers and token coercion for graph node/edge converters.</summary>
internal static class GraphJsonScalarReaders
{
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
                        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("1", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("yes", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("enabled", StringComparison.OrdinalIgnoreCase))
                            return 1.0;

                        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("0", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("no", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("off", StringComparison.OrdinalIgnoreCase)
                            || raw.Equals("disabled", StringComparison.OrdinalIgnoreCase))
                            return 0.0;

                        if (double.TryParse(raw, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out double parsed))
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

    internal static bool TryReadStringToken(JsonElement element, out string? value)
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

    internal static string? TryReadWholeNumberLongToken(JsonElement element)
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

    internal static bool TryNormalizeBooleanString(string? raw, out string? value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = null;

            return false;
        }

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("1", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = "true";

            return true;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("0", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("no", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("off", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = "false";

            return true;
        }

        value = null;

        return false;
    }

    internal static bool TryParseWholeNumberLongString(string? raw, out long value)
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
