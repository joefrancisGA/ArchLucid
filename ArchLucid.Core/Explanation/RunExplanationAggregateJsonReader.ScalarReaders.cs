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

        string numericText = raw.Trim();

        int percentIndex = numericText.LastIndexOf('%');

        if (percentIndex >= 0)
            numericText = numericText[..percentIndex].TrimEnd();

        if (double.TryParse(numericText, NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)
            && double.IsFinite(parsed))
        {
            return parsed;
        }

        return null;
    }

    /// <summary>
    ///     Maps aggregate faithfulness-style ratios to <c>[0, 1]</c>: values in <c>(1, 100]</c> are treated as
    ///     percentages; values outside <c>[0, 100]</c> are discarded.
    /// </summary>
    public static double? NormalizeUnitRatio(double? value)
    {
        if (value is not { } numeric || !double.IsFinite(numeric))
            return null;

        if (numeric < 0 || numeric > 100)
            return null;

        if (numeric > 1)
            return numeric / 100;

        return numeric;
    }

    internal static bool TryReadAggregateBooleanToken(JsonElement element, out bool value)
    {
        if (TryReadBooleanScalarValue(element, out value))
            return true;

        if (element.ValueKind != JsonValueKind.Array)
        {
            value = default;

            return false;
        }

        foreach (JsonElement item in element.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array)
            {
                if (TryReadAggregateBooleanToken(item, out value))
                    return true;

                continue;
            }

            if (TryReadBooleanScalarValue(item, out value))
                return true;
        }

        value = default;

        return false;
    }

    private static bool TryReadBooleanScalarValue(JsonElement element, out bool value)
    {
        if (element.ValueKind == JsonValueKind.True)
        {
            value = true;

            return true;
        }

        if (element.ValueKind == JsonValueKind.False)
        {
            value = false;

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            if (element.TryGetInt32(out int numeric))
            {

                if (numeric < 0)
                {
                    value = default;

                    return false;
                }

                value = numeric != 0;

                return true;
            }

            if (element.TryGetDouble(out double wholeNumber)
                && double.IsFinite(wholeNumber)
                // Bound the conversion because an out-of-range double-to-int cast saturates instead of failing.
                && wholeNumber >= 0
                && wholeNumber <= int.MaxValue
                && wholeNumber == Math.Floor(wholeNumber))
            {
                value = wholeNumber != 0;

                return true;
            }
        }
        else if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString()?.Trim();

            if (string.IsNullOrWhiteSpace(raw))
            {
                value = default;

                return false;
            }

            if (TryParseBooleanString(raw, out value))
                return true;

            if (TryParseWholeNumberString(raw, out int numericFromString))
            {
                value = numericFromString != 0;

                return true;
            }
        }
        else
        {
            value = default;

            return false;
        }

        value = default;

        return false;
    }

    public static bool TryReadBoolean(JsonElement element)
    {
        if (TryReadBooleanScalarValue(element, out bool value))
            return value;

        return false;
    }

    public static bool TryReadWholeNumber(JsonElement element, out int value)
    {
        if (element.ValueKind == JsonValueKind.Number)
        {
            if (element.TryGetInt32(out value) && value >= 0)
                return true;

            if (element.TryGetDouble(out double numeric)
                && double.IsFinite(numeric)
                && numeric >= 0
                // Bound the conversion because an out-of-range double-to-int cast saturates instead of failing.
                && numeric <= int.MaxValue
                && numeric == Math.Floor(numeric))
            {
                value = (int)numeric;

                return true;
            }
        }
        else if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (TryParseWholeNumberString(raw, out value))
                return true;
        }
        else if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.ValueKind == JsonValueKind.True ? 1 : 0;

            return true;
        }

        value = default;

        return false;
    }
}
