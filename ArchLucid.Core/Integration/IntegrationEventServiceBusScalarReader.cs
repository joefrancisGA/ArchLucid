using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Integration;

/// <summary>Shared scalar normalization for optional Service Bus event metadata.</summary>
internal static class IntegrationEventServiceBusScalarReader
{
    internal static bool TryGetProperty(JsonElement root, string name, out string? value)
    {
        if (root.ValueKind == JsonValueKind.Object)
        {
            foreach (JsonProperty property in root.EnumerateObject())
            {
                if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                    return TryReadStringOrNumberToken(property.Value, out value);
            }
        }

        value = null;
        return false;
    }

    internal static bool TryReadStringOrNumberToken(JsonElement element, out string? value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberString(raw.Trim(), out long numericFromString))
            {
                value = numericFromString.ToString(CultureInfo.InvariantCulture);

                return true;
            }

            if (TryNormalizeBooleanString(raw, out string? normalized))
            {
                value = normalized;

                return true;
            }

            value = raw;

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numeric))
        {
            value = numeric.ToString(CultureInfo.InvariantCulture);

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number
            && TryParseWholeNumberString(element.GetRawText(), out long wholeNumber))
        {
            value = wholeNumber.ToString(CultureInfo.InvariantCulture);

            return true;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return true;
        }

        value = null;

        return false;
    }

    private static bool TryParseWholeNumberString(string raw, out long value)
    {
        if (long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (decimal.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal numeric)
            && numeric >= 0m
            && numeric <= long.MaxValue
            && numeric == decimal.Truncate(numeric))
        {
            value = (long)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryNormalizeBooleanString(string? raw, out string? value)
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
}
