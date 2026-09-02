using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>Shared JSON token readers for run explanation aggregate callout builders.</summary>
internal static class RunExplanationAggregateJsonReader
{
    public static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }

    public static double? TryReadFiniteDouble(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric))
        {
            return numeric;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
                return element.ValueKind == JsonValueKind.True ? 1.0 : 0.0;

            return null;
        }

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("1", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            return 1.0;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("0", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("no", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("off", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            return 0.0;
        }

        if (double.TryParse(raw.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)
            && double.IsFinite(parsed))
        {
            return parsed;
        }

        return null;
    }

    public static bool TryReadBoolean(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.True)
            return true;

        if (element.ValueKind == JsonValueKind.False)
            return false;

        if (element.ValueKind == JsonValueKind.Number)
        {
            if (element.TryGetInt32(out int numeric))
                return numeric != 0;

            if (element.TryGetDouble(out double wholeNumber)
                && double.IsFinite(wholeNumber)
                && wholeNumber == Math.Floor(wholeNumber))
            {
                return wholeNumber != 0;
            }

            return false;
        }

        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString()?.Trim();

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("1", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("0", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("no", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("off", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (TryParseWholeNumberString(raw, out int numericFromString))
            return numericFromString != 0;

        return false;
    }

    public static bool TryReadWholeNumber(JsonElement element, out int value)
    {
        if (element.TryGetInt32(out value))
            return true;

        if (element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    public static bool TryParseWholeNumberString(string? raw, out int value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    public static bool TryReadNonEmptyTextToken(JsonElement element, out string? value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseBooleanString(raw, out bool boolean))
            {
                value = boolean ? "true" : "false";

                return !string.IsNullOrWhiteSpace(value);
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberString(raw.Trim(), out int numericFromString))
            {
                value = numericFromString.ToString(CultureInfo.InvariantCulture);

                return !string.IsNullOrWhiteSpace(value);
            }

            value = raw;

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            if (element.TryGetInt64(out long numeric))
            {
                value = numeric.ToString(CultureInfo.InvariantCulture);

                return !string.IsNullOrWhiteSpace(value);
            }

            if (element.TryGetDouble(out double wholeNumber)
                && double.IsFinite(wholeNumber)
                && wholeNumber >= 0
                && wholeNumber == Math.Floor(wholeNumber))
            {
                value = ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);

                return !string.IsNullOrWhiteSpace(value);
            }

            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        value = null;

        return false;
    }

    public static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("1", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("on", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("0", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("no", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("off", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }
}
