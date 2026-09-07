using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Findings.Serialization;

internal static class FindingJsonStringReaders
{
    internal static string? ReadOptionalString(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind is JsonValueKind.Null)
            return null;

        if (el.ValueKind == JsonValueKind.String)
        {
            string? raw = el.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && TryCoerceStringTokenToRawText(raw, out string? coerced))
                return coerced;

            return raw;
        }

        if (el.ValueKind == JsonValueKind.Number && el.TryGetInt64(out long numeric))
            return numeric.ToString(CultureInfo.InvariantCulture);

        if (el.ValueKind == JsonValueKind.Number
            && el.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
            return ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);

        if (el.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return el.GetRawText();

        return null;
    }

    internal static string ReadRequiredString(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el))
            throw new JsonException($"{name} is required.");

        return ReadStringDictValue(el);
    }

    internal static void WriteOptionalString(Utf8JsonWriter writer, string name, string? value)
    {
        if (value is null)
        {
            writer.WriteNull(name);

            return;
        }

        writer.WriteString(name, value);
    }

    internal static List<string> ReadStringList(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind != JsonValueKind.Array)
            return [];

        return el.EnumerateArray().Select(ReadStringDictValue).Where(s => s.Length > 0).ToList();
    }

    internal static Dictionary<string, string> ReadStringDict(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind != JsonValueKind.Object)
            return new Dictionary<string, string>();
        Dictionary<string, string> d = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty p in el.EnumerateObject())
            d[p.Name] = ReadStringDictValue(p.Value);

        return d;
    }

    internal static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;

                return true;
            }
        }

        value = default;

        return false;
    }

    internal static string ReadStringDictValue(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString() ?? "";

            if (!string.IsNullOrWhiteSpace(raw)
                && TryCoerceStringTokenToRawText(raw, out string? coerced))
                return coerced ?? "";

            return raw;
        }

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numeric))
            return numeric.ToString(CultureInfo.InvariantCulture);

        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
            return ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return element.GetRawText();

        return "";
    }

    internal static bool TryCoerceStringTokenToRawText(string raw, out string? value)
    {
        if (JsonBooleanStringReader.TryParseBooleanString(raw, out bool boolean))
        {
            value = boolean ? "true" : "false";

            return true;
        }

        if (FindingJsonNumericReaders.TryParseWholeNumberLongString(raw, out long numericFromString))
        {
            value = numericFromString.ToString(CultureInfo.InvariantCulture);

            return true;
        }

        value = null;

        return false;
    }

}
