using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Shared ARM scalar coercion for inventory extractors (boolean/number/string variants and object-wrapped values).
/// </summary>
public static class AzureInventoryArmTolerantScalarReader
{
    private static readonly string[] DefaultObjectScalarPropertyNames = ["ipAddress", "address", "value", "id"];

    public static bool IsSupportedScalarValueKind(JsonElement value) =>
        value.ValueKind is JsonValueKind.String
            or JsonValueKind.Number
            or JsonValueKind.True
            or JsonValueKind.False;

    public static bool TryReadBoolean(JsonElement element, out bool value)
    {
        value = default;

        if (element.ValueKind is JsonValueKind.True)
        {
            value = true;

            return true;
        }

        if (element.ValueKind is JsonValueKind.False)
        {
            value = false;

            return true;
        }

        if (element.ValueKind is JsonValueKind.String)
        {
            return JsonBooleanStringReader.TryParseBooleanString(element.GetString(), out value);
        }

        if (element.ValueKind is JsonValueKind.Number
            && TryReadInt64(element, out long numeric))
        {
            value = numeric != 0;

            return true;
        }

        return false;
    }

    public static bool TryReadBooleanProperty(JsonElement parent, string propertyName, bool defaultWhenMissing)
    {
        if (!parent.TryGetProperty(propertyName, out JsonElement element))
        {
            return defaultWhenMissing;
        }

        if (TryReadBoolean(element, out bool parsed))
        {
            return parsed;
        }

        return false;
    }

    public static bool TryReadInt32(JsonElement element, out int value)
    {
        value = default;

        if (element.ValueKind is JsonValueKind.Number
            && element.TryGetInt32(out value))
        {
            return true;
        }

        if (element.ValueKind is JsonValueKind.String
            && int.TryParse(element.GetString()?.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (element.ValueKind is JsonValueKind.Number
            && element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= int.MinValue
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        return false;
    }

    public static bool TryReadInt64(JsonElement element, out long value)
    {
        value = default;

        if (element.ValueKind is JsonValueKind.Number
            && element.TryGetInt64(out value))
        {
            return true;
        }

        if (element.ValueKind is JsonValueKind.String
            && TryParseWholeNumberLongString(element.GetString(), out value))
        {
            return true;
        }

        if (element.ValueKind is JsonValueKind.Number
            && element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= long.MinValue
            && numeric <= long.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (long)numeric;

            return true;
        }

        return false;
    }

    public static bool TryReadInvariantScalarText(JsonElement element, out string? text)
    {
        text = null;

        if (element.ValueKind is JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (TryNormalizeBooleanString(raw, out string? normalizedBoolean))
            {
                text = normalizedBoolean;

                return true;
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberLongString(raw.Trim(), out long numericFromString))
            {
                text = numericFromString.ToString(CultureInfo.InvariantCulture);

                return true;
            }

            text = raw;

            return !string.IsNullOrWhiteSpace(text);
        }

        if (element.ValueKind is JsonValueKind.Number)
        {
            text = TryReadWholeNumberLongToken(element);

            return text is not null;
        }

        if (element.ValueKind is JsonValueKind.True)
        {
            text = "true";

            return true;
        }

        if (element.ValueKind is JsonValueKind.False)
        {
            text = "false";

            return true;
        }

        return false;
    }

    public static string? TryFormatPropertyBagScalar(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
        {
            return AzureExtractorSensitivePropertyRedactor.RedactStructuredJson(element);
        }

        if (element.ValueKind is JsonValueKind.Null)
        {
            return string.Empty;
        }

        if (!TryReadInvariantScalarText(element, out string? text))
        {
            return element.GetRawText();
        }

        return text ?? string.Empty;
    }

    public static string? TryReadStringOrObjectScalar(JsonElement element)
    {
        if (TryReadInvariantScalarText(element, out string? scalarText)
            && !string.IsNullOrWhiteSpace(scalarText))
        {
            return scalarText.Trim();
        }

        if (element.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        foreach (string propertyName in DefaultObjectScalarPropertyNames)
        {
            string? nested = AzureInventoryArmNestedObjectPropertyReader.TryReadString(element, propertyName);

            if (!string.IsNullOrWhiteSpace(nested))
            {
                return nested.Trim();
            }
        }

        return null;
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

    private static bool TryNormalizeBooleanString(string? raw, out string? value)
    {
        if (!JsonBooleanStringReader.TryParseBooleanString(raw, out bool parsed))
        {
            value = null;

            return false;
        }

        value = parsed ? "true" : "false";

        return true;
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
