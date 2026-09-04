using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Alerts.Delivery;

public static partial class AlertRoutingCriteriaMetadata
{
    private static IReadOnlyList<string> ReadSeverityArray(JsonElement parent, string propertyName)
    {
        if (!TryGetPropertyCaseInsensitive(parent, propertyName, out JsonElement arrayElement) ||
            arrayElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            string? value = ReadSeverityArrayItem(item);

            if (!string.IsNullOrWhiteSpace(value))
            {
                values.Add(value.Trim());
            }
        }

        return values;
    }

    private static string? ReadSeverityArrayItem(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
        {
            string? raw = item.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString))
            {
                return MapFindingSeverityOrdinalToAlertLabel(numericFromString);
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && double.TryParse(raw.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out double numericFromDecimalString)
                && double.IsFinite(numericFromDecimalString)
                && numericFromDecimalString == Math.Floor(numericFromDecimalString))
            {
                return MapFindingSeverityOrdinalToAlertLabel((int)numericFromDecimalString);
            }

            if (TryNormalizeBooleanString(raw, out string? normalized))
            {
                return normalized;
            }

            return raw;
        }

        if (item.ValueKind == JsonValueKind.Number && TryReadWholeNumberSeverityOrdinal(item, out int numeric))
        {
            return MapFindingSeverityOrdinalToAlertLabel(numeric);
        }

        if (item.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            return item.GetRawText();
        }

        return null;
    }

    private static bool TryReadWholeNumberSeverityOrdinal(JsonElement element, out int value)
    {
        if (element.TryGetInt32(out value))
        {
            return true;
        }

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

    private static string? MapFindingSeverityOrdinalToAlertLabel(int ordinal)
    {
        if (!Enum.IsDefined(typeof(FindingSeverity), ordinal))
        {
            return null;
        }

        return (FindingSeverity)ordinal switch
        {
            FindingSeverity.Info => AlertSeverity.Info,
            FindingSeverity.Warning => AlertSeverity.Warning,
            FindingSeverity.Error => AlertSeverity.High,
            FindingSeverity.Critical => AlertSeverity.Critical,
            _ => null,
        };
    }

    private static IReadOnlyList<string> ReadStringArray(JsonElement parent, string propertyName)
    {
        if (!TryGetPropertyCaseInsensitive(parent, propertyName, out JsonElement arrayElement) ||
            arrayElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            if (TryReadStringArrayItem(item, out string? value) && !string.IsNullOrWhiteSpace(value))
            {
                values.Add(value.Trim());
            }
        }

        return values;
    }

    private static bool TryReadStringArrayItem(JsonElement item, out string? value)
    {
        if (item.ValueKind == JsonValueKind.String)
        {
            string? raw = item.GetString();

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

        if (item.ValueKind == JsonValueKind.Number)
        {
            value = TryReadWholeNumberLongToken(item);

            return value is not null;
        }

        if (item.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = item.GetRawText();

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
