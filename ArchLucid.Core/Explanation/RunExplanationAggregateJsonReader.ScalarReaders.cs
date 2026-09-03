using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Explanation;

internal static partial class RunExplanationAggregateJsonReader
{
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
}
