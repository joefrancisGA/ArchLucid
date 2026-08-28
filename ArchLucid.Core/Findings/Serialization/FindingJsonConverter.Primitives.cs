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

        if (el.ValueKind == JsonValueKind.Number && el.TryGetInt64(out long numeric))
            return numeric.ToString(System.Globalization.CultureInfo.InvariantCulture);

        return el.GetString();
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

        return el.EnumerateArray().Select(e => e.GetString() ?? "").Where(s => s.Length > 0).ToList();
    }

    private static Dictionary<string, string> ReadStringDict(JsonElement root, string name)
    {
        if (!TryGetPropertyCaseInsensitive(root, name, out JsonElement el) || el.ValueKind != JsonValueKind.Object)
            return new Dictionary<string, string>();
        Dictionary<string, string> d = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty p in el.EnumerateObject())
            d[p.Name] = p.Value.GetString() ?? "";
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
}
