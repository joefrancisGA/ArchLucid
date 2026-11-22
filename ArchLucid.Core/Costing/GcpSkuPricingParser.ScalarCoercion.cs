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
            && TryReadWholeNumberDecimal(element, out decimal numeric)
            && numeric <= long.MaxValue)
        {
            value = (long)numeric;

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
            && TryReadWholeNumberDecimal(element, out decimal numeric)
            && numeric >= int.MinValue
            && numeric <= int.MaxValue)
        {
            value = (int)numeric;

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

        if (int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        return TryParseWholeNumberString(raw.Trim(), out value);
    }

    private static bool TryReadWholeNumberDecimal(JsonElement element, out decimal value)
    {
        value = default;

        if (element.ValueKind != JsonValueKind.Number || !element.TryGetDecimal(out value))
            return false;

        return value >= 0 && value == decimal.Truncate(value);
    }

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (decimal.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal numeric)
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

    private static bool TryParseWholeNumberString(string raw, out long value)
    {
        if (long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (decimal.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal numeric)
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
}
