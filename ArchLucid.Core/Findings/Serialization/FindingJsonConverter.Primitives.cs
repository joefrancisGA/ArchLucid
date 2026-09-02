using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Findings;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
    /// <summary>
    ///     Deserializes the <c>trace</c> property from <paramref name="root" />.
    ///     When deserialization fails the corrupt JSON is noted in <paramref name="finding" />
    ///     <c>Properties["_traceDeserializationWarning"]</c> so downstream consumers
    ///     can detect data loss without silently discarding the error.
    /// </summary>
    private static ExplainabilityTrace ReadTrace(JsonElement root, JsonSerializerOptions options, Finding finding)
    {
        if (!TryGetPropertyCaseInsensitive(root, "trace", out JsonElement tr))
            return new ExplainabilityTrace();
        try
        {
            return JsonSerializer.Deserialize<ExplainabilityTrace>(tr.GetRawText(), options) ??
                   new ExplainabilityTrace();
        }
        catch (JsonException ex)
        {
            finding.Properties["_traceDeserializationWarning"] =
                $"Trace JSON could not be deserialized and was replaced with an empty trace. Error: {ex.Message}";
            return new ExplainabilityTrace();
        }
    }

    private static string? ReadOptionalString(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind is JsonValueKind.Null)
            return null;

        if (el.ValueKind == JsonValueKind.String)
            return el.GetString();

        if (el.ValueKind == JsonValueKind.Number && el.TryGetInt64(out long numeric))
            return numeric.ToString(CultureInfo.InvariantCulture);

        if (el.ValueKind == JsonValueKind.Number
            && el.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
            return ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);

        return null;
    }

    private static string ReadRequiredString(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el))
            throw new KeyNotFoundException("The given key was not present in the dictionary.");

        return ReadStringDictValue(el);
    }

    private static void WriteOptionalString(Utf8JsonWriter writer, string name, string? value)
    {
        if (value is null)
        {
            writer.WriteNull(name);

            return;
        }

        writer.WriteString(name, value);
    }

    private static List<string> ReadStringList(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind != JsonValueKind.Array)
            return [];

        return el.EnumerateArray().Select(ReadStringDictValue).Where(s => s.Length > 0).ToList();
    }

    private static Dictionary<string, string> ReadStringDict(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind != JsonValueKind.Object)
            return new Dictionary<string, string>();
        Dictionary<string, string> d = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty p in el.EnumerateObject())
            d[p.Name] = ReadStringDictValue(p.Value);

        return d;
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
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

    private static string ReadStringDictValue(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String)
            return element.GetString() ?? "";

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numeric))
            return numeric.ToString(CultureInfo.InvariantCulture);

        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
            return ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);

        return "";
    }

    private static bool TryReadWholeNumberInt32(JsonElement element, out int value)
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

    private static bool TryReadFiniteDouble(JsonElement element, out double value)
    {
        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric))
        {
            value = numeric;

            return true;
        }

        if (element.ValueKind == JsonValueKind.String
            && double.TryParse(element.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)
            && double.IsFinite(parsed))
        {
            value = parsed;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryReadInt32(JsonElement element, out int value)
    {
        if (TryReadWholeNumberInt32(element, out value))
            return true;

        if (element.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(element.GetString(), out value))
            return true;

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string? raw, out int value)
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
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryReadDecimal(JsonElement element, out decimal value)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetDecimal(out value))
            return true;

        if (element.ValueKind == JsonValueKind.String
            && decimal.TryParse(element.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out value))
            return true;

        value = default;

        return false;
    }

    private static bool TryReadReviewedAtUtc(JsonElement element, out DateTimeOffset value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && DateTimeOffset.TryParse(
                    raw,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.RoundtripKind,
                    out value))
            {
                return true;
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && long.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out long unixMilliseconds))
            {
                value = DateTimeOffset.FromUnixTimeMilliseconds(unixMilliseconds);

                return true;
            }

            value = default;

            return false;
        }

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numericUnixMilliseconds))
        {
            value = DateTimeOffset.FromUnixTimeMilliseconds(numericUnixMilliseconds);

            return true;
        }

        value = default;

        return false;
    }
}
