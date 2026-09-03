using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Costing;

internal static class GcpSkuPricingParser
{
    public static bool TryReadHourlyUsdFromSku(JsonElement sku, string machineType, out decimal hourlyUsd)
    {
        hourlyUsd = 0m;

        if (!TryGetPropertyCaseInsensitive(sku, "description", out JsonElement descriptionElement))
            return false;

        string? description = descriptionElement.GetString();

        if (string.IsNullOrWhiteSpace(description)
            || !DescriptionMatchesMachineType(description, machineType))
        {
            return false;
        }

        if (!TryGetPropertyCaseInsensitive(sku, "pricingInfo", out JsonElement pricingInfo)
            || pricingInfo.GetArrayLength() == 0)
        {
            return false;
        }

        foreach (JsonElement pricingEntry in pricingInfo.EnumerateArray())
        {
            if (!TryGetPropertyCaseInsensitive(pricingEntry, "pricingExpression", out JsonElement expression))
                continue;

            if (!TryGetPropertyCaseInsensitive(expression, "usageUnit", out JsonElement usageUnit)
                || !IsHourlyUsageUnit(usageUnit))
            {
                continue;
            }

            if (!TryReadTieredRateUsd(pricingEntry, out decimal hourly))
                continue;

            hourlyUsd = hourly;

            return true;
        }

        return false;
    }

    private static bool TryReadTieredRateUsd(JsonElement pricingInfo, out decimal hourlyUsd)
    {
        hourlyUsd = 0m;

        if (!TryGetPropertyCaseInsensitive(pricingInfo, "pricingExpression", out JsonElement expression))
            return false;

        if (!TryGetPropertyCaseInsensitive(expression, "tieredRates", out JsonElement tieredRates)
            || tieredRates.GetArrayLength() == 0)
        {
            return false;
        }

        foreach (JsonElement tier in tieredRates.EnumerateArray())
        {
            if (!TryGetPropertyCaseInsensitive(tier, "unitPrice", out JsonElement unitPrice))
                continue;

            long units = 0;

            if (TryGetPropertyCaseInsensitive(unitPrice, "units", out JsonElement unitsElement)
                && !TryReadInt64Token(unitsElement, out units))
            {
                units = 0;
            }

            int nanos = 0;

            if (TryGetPropertyCaseInsensitive(unitPrice, "nanos", out JsonElement nanosElement)
                && !TryReadInt32Token(nanosElement, out nanos))
            {
                nanos = 0;
            }

            hourlyUsd = units + nanos / 1_000_000_000m;

            if (hourlyUsd > 0m)
                return true;
        }

        hourlyUsd = 0m;

        return false;
    }

    private static bool IsHourlyUsageUnit(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return element.ValueKind == JsonValueKind.True;

        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString();

        if (TryParseBooleanString(raw, out bool boolean))
            return boolean;

        string? trimmed = raw?.Trim();

        return string.Equals(trimmed, "h", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "Hrs", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hr", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hour", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hours", StringComparison.OrdinalIgnoreCase);
    }

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

    private static bool DescriptionMatchesMachineType(string description, string machineType)
    {
        int index = description.IndexOf(machineType, StringComparison.OrdinalIgnoreCase);

        if (index < 0)
            return false;

        int endIndex = index + machineType.Length;

        if (index > 0)
        {
            char previous = description[index - 1];

            if (previous is >= '0' and <= '9' or '-')
                return false;

            // Reject letter-variant prefixes such as e2-micro matching ve2-micro.
            if (char.IsLetter(previous))
                return false;
        }

        if (endIndex >= description.Length)
            return true;

        char next = description[endIndex];

        // Reject prefix collisions such as n1-standard-1 matching n1-standard-10.
        if (next is >= '0' and <= '9' or '-')
            return false;

        // Reject letter-variant suffixes such as n1-standard-1 matching n1-standard-1d.
        if (char.IsDigit(description[endIndex - 1]) && char.IsLetter(next))
            return false;

        return true;
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
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
}
