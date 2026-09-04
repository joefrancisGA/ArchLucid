using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Costing;

internal static partial class GcpSkuPricingParser
{
    private static bool TryReadInt64Token(JsonElement element, out long value)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out value))
            return true;

        if (element.ValueKind == JsonValueKind.Number
            && TryReadWholeNumberDouble(element, out double numeric)
            && numeric <= long.MaxValue)
        {
            value = (long)numeric;

            return true;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.ValueKind == JsonValueKind.True ? 1L : 0L;

            return true;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            value = default;

            return false;
        }

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        if (TryParseBooleanString(raw, out bool boolean))
        {
            value = boolean ? 1L : 0L;

            return true;
        }

        if (long.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        return TryParseWholeNumberString(raw.Trim(), out value);
    }

    private static bool TryReadInt32Token(JsonElement element, out int value)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out value))
            return true;

        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetInt64(out long wholeNumber)
            && wholeNumber >= int.MinValue
            && wholeNumber <= int.MaxValue)
        {
            value = (int)wholeNumber;

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number
            && TryReadWholeNumberDouble(element, out double numeric)
            && numeric >= int.MinValue
            && numeric <= int.MaxValue)
        {
            value = (int)numeric;

            return true;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.ValueKind == JsonValueKind.True ? 1 : 0;

            return true;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            value = default;

            return false;
        }

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        if (TryParseBooleanString(raw, out bool boolean))
        {
            value = boolean ? 1 : 0;

            return true;
        }

        if (int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        return TryParseWholeNumberString(raw.Trim(), out value);
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
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

    private static bool TryReadWholeNumberDouble(JsonElement element, out double value)
    {
        value = default;

        if (element.ValueKind != JsonValueKind.Number || !element.TryGetDouble(out value))
            return false;

        return double.IsFinite(value) && value >= 0 && value == Math.Floor(value);
    }

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string raw, out long value)
    {
        if (long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= long.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (long)numeric;

            return true;
        }

        value = default;

        return false;
    }
}
