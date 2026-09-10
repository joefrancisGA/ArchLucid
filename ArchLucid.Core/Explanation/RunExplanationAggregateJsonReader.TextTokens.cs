using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Explanation;

internal static partial class RunExplanationAggregateJsonReader
{
    public static bool TryParseWholeNumberString(string? raw, out int value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
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

    public static bool TryReadNonEmptyTextToken(JsonElement element, out string? value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && JsonBooleanStringReader.TryParseBooleanString(raw, out bool boolean))
            {
                value = boolean ? "true" : "false";

                return !string.IsNullOrWhiteSpace(value);
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberString(raw.Trim(), out int numericFromString))
            {
                value = numericFromString.ToString(CultureInfo.InvariantCulture);

                return !string.IsNullOrWhiteSpace(value);
            }

            value = raw;

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            if (element.TryGetInt64(out long numeric))
            {
                value = numeric.ToString(CultureInfo.InvariantCulture);

                return !string.IsNullOrWhiteSpace(value);
            }

            if (element.TryGetDouble(out double wholeNumber)
                && double.IsFinite(wholeNumber)
                && wholeNumber >= 0
                && wholeNumber == Math.Floor(wholeNumber))
            {
                value = ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);

                return !string.IsNullOrWhiteSpace(value);
            }

            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        value = null;

        return false;
    }

    public static bool TryParseBooleanString(string? raw, out bool value) =>
        JsonBooleanStringReader.TryParseBooleanString(raw, out value);
}
