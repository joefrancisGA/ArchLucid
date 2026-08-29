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

    private static DateTimeOffset? ReadOptionalDateTimeOffset(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind == JsonValueKind.Null)
            return null;

        if (el.ValueKind == JsonValueKind.String &&
            DateTimeOffset.TryParse(el.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind,
                out DateTimeOffset parsed))
            return parsed;

        if (el.ValueKind != JsonValueKind.Number || !el.TryGetInt64(out long unix))
            return null;

        // Exporters often emit Unix epoch milliseconds; second-precision values stay 10 digits through year 2286.
        return Math.Abs(unix) > 9_999_999_999
            ? DateTimeOffset.FromUnixTimeMilliseconds(unix)
            : DateTimeOffset.FromUnixTimeSeconds(unix);
    }

    private static string? ReadOptionalString(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind is JsonValueKind.Null)
            return null;

        if (el.ValueKind == JsonValueKind.String)
            return el.GetString();

        string coerced = ReadStringDictValue(el);

        return coerced.Length == 0 ? null : coerced;
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

        return el.EnumerateArray()
            .Select(ReadStringDictValue)
            .Where(s => s.Length > 0)
            .ToList();
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

    private static string ReadStringDictValue(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String)
            return element.GetString() ?? "";

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numeric))
            return numeric.ToString(CultureInfo.InvariantCulture);

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return element.GetBoolean().ToString(CultureInfo.InvariantCulture);

        return "";
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
        => element.TryGetPropertyCaseInsensitive(propertyName, out value);

    private static int? ReadOptionalInt32(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind == JsonValueKind.Null)
            return null;

        if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out int numeric))
            return numeric;

        if (el.ValueKind == JsonValueKind.String &&
            int.TryParse(el.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int fromString))
            return fromString;

        return null;
    }

    private static double? ReadOptionalDouble(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind == JsonValueKind.Null)
            return null;

        if (el.ValueKind == JsonValueKind.Number && el.TryGetDouble(out double numeric))
            return numeric;

        if (el.ValueKind == JsonValueKind.String &&
            double.TryParse(el.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out double fromString))
            return fromString;

        return null;
    }

    private static decimal? ReadOptionalDecimal(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind == JsonValueKind.Null)
            return null;

        if (el.ValueKind == JsonValueKind.Number && el.TryGetDecimal(out decimal numeric))
            return numeric;

        if (el.ValueKind == JsonValueKind.String &&
            decimal.TryParse(el.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out decimal fromString))
            return fromString;

        return null;
    }
}
