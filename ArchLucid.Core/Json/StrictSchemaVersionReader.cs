using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.Core.Json;

/// <summary>
///     Reads JSON <c>schemaVersion</c> values as whole-number schema ids only (no boolean or on/off synonyms).
/// </summary>
public static class StrictSchemaVersionReader
{
    public static bool TryReadSchemaVersion(JsonElement element, out int schemaVersion)
    {
        if (element.ValueKind == JsonValueKind.Number
            && TryReadWholeNumberSchemaVersion(element, out schemaVersion))
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(element.GetString(), out schemaVersion))
        {
            return true;
        }

        schemaVersion = default;

        return false;
    }

    public static bool TryReadSchemaVersion(JsonNode? versionNode, out int schemaVersion)
    {
        if (versionNode is null)
        {
            schemaVersion = default;

            return false;
        }

        if (versionNode.GetValueKind() == JsonValueKind.Number
            && TryReadWholeNumberSchemaVersion(versionNode, out schemaVersion))
        {
            return true;
        }

        if (versionNode.GetValueKind() == JsonValueKind.String
            && versionNode is JsonValue jsonValue
            && TryParseWholeNumberString(jsonValue.GetValue<string>(), out schemaVersion))
        {
            return true;
        }

        schemaVersion = default;

        return false;
    }

    public static bool TryReadWholeNumberSchemaVersion(JsonElement element, out int schemaVersion)
    {
        if (element.TryGetInt32(out schemaVersion))
        {
            return true;
        }

        if (element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric)
            && HasIntegralDecimalDigits(element.GetRawText()))
        {
            schemaVersion = (int)numeric;

            return true;
        }

        schemaVersion = default;

        return false;
    }

    public static bool TryReadWholeNumberSchemaVersion(JsonNode versionNode, out int schemaVersion)
    {
        if (versionNode is not JsonValue jsonValue)
        {
            schemaVersion = default;

            return false;
        }

        if (jsonValue.TryGetValue<int>(out schemaVersion))
        {
            return true;
        }

        if (jsonValue.TryGetValue<double>(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric)
            && HasIntegralDecimalDigits(jsonValue.ToJsonString()))
        {
            schemaVersion = (int)numeric;

            return true;
        }

        schemaVersion = default;

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
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric)
            && HasIntegralDecimalDigits(trimmed))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    // Floating-point conversion can round a fractional decimal (or an underflow)
    // to an integer. Check the original decimal digits before accepting the result.
    private static bool HasIntegralDecimalDigits(string raw)
    {
        ReadOnlySpan<char> text = raw.AsSpan();
        int exponentIndex = text.IndexOfAny('e', 'E');
        ReadOnlySpan<char> mantissa = exponentIndex < 0 ? text : text[..exponentIndex];

        int fractionalDigits = 0;
        int trailingZeros = 0;
        bool afterDecimalPoint = false;
        bool hasNonzeroDigit = false;

        foreach (char digit in mantissa)
        {
            if (digit == '.')
            {
                afterDecimalPoint = true;
                continue;
            }

            if (digit is '+' or '-')
                continue;

            if (digit is < '0' or > '9')
                return false;

            if (afterDecimalPoint)
                fractionalDigits++;

            if (digit == '0')
            {
                trailingZeros++;
            }
            else
            {
                hasNonzeroDigit = true;
                trailingZeros = 0;
            }
        }

        if (!hasNonzeroDigit)
            return true;

        int exponent = 0;
        if (exponentIndex >= 0
            && !int.TryParse(text[(exponentIndex + 1)..], NumberStyles.AllowLeadingSign,
                CultureInfo.InvariantCulture, out exponent))
        {
            return false;
        }

        return (long)fractionalDigits - trailingZeros <= exponent;
    }
}
