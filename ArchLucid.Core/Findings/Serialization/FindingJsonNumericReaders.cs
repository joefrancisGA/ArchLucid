using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Findings.Serialization;

internal static class FindingJsonNumericReaders
{
    internal static bool TryReadWholeNumberInt32(JsonElement element, out int value)
    {
        if (element.ValueKind != JsonValueKind.Number)
        {
            value = default;

            return false;
        }

        if (element.TryGetInt32(out value))
        {
            return true;
        }

        // Parse the original JSON token exactly; a double can round an
        // out-of-range integer into a different in-range value.
        if (decimal.TryParse(element.GetRawText(), NumberStyles.Float,
                             CultureInfo.InvariantCulture, out decimal numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == decimal.Truncate(numeric))
        {
            value = (int)numeric;
            return true;
        }

        value = default;

        return false;
    }

    internal static bool TryReadFiniteDouble(JsonElement element, out double value)
    {
        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric))
        {
            value = numeric;

            return true;
        }

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)
                && double.IsFinite(parsed))
            {
                value = parsed;

                return true;
            }
        }

        value = default;

        return false;
    }

    internal static bool TryReadInt32(JsonElement element, out int value)
    {
        if (TryReadWholeNumberInt32(element, out value))
            return true;

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (TryParseWholeNumberString(raw, out value))
                return true;
        }

        value = default;

        return false;
    }

    internal static bool TryParseWholeNumberString(string? raw, out int value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (decimal.TryParse(trimmed, NumberStyles.Float,
                             CultureInfo.InvariantCulture, out decimal numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == decimal.Truncate(numeric))
        {
            value = (int)numeric;
            return true;
        }

        value = default;

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

        // Decimal preserves integral values across the full Int64 range,
        // including values beyond double's exact-integer precision.
        if (decimal.TryParse(trimmed, NumberStyles.Float,
                             CultureInfo.InvariantCulture, out decimal numeric)
            && numeric >= 0
            && numeric <= long.MaxValue
            && numeric == decimal.Truncate(numeric))
        {
            value = (long)numeric;
            return true;
        }

        value = default;

        return false;
    }

    internal static bool TryReadDecimal(JsonElement element, out decimal value)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetDecimal(out value))
            return true;

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out value))
                return true;
        }

        value = default;

        return false;
    }
}
