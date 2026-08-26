using System.Globalization;
using System.Text.Json;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Canonical JSON rewrite for infrastructure declaration <c>tf.*</c> object/array blobs.
/// </summary>
public static class CanonicalInfrastructureJsonValue
{
    public static string CanonicalizeText(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => (value.GetString() ?? string.Empty).Trim().ToLowerInvariant(),
            JsonValueKind.Number => CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(value),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            JsonValueKind.Object => SerializeCanonicalJson(value),
            JsonValueKind.Array => SerializeCanonicalJson(value),
            _ => value.GetRawText()
        };
    }

    private static string SerializeCanonicalJson(JsonElement value)
    {
        using MemoryStream stream = new();
        using Utf8JsonWriter writer = new(stream);
        WriteCanonicalJsonValue(writer, value);
        writer.Flush();

        return System.Text.Encoding.UTF8.GetString(stream.ToArray());
    }

    private static void WriteCanonicalJsonValue(Utf8JsonWriter writer, JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.String:
                writer.WriteStringValue((value.GetString() ?? string.Empty).Trim().ToLowerInvariant());
                break;

            case JsonValueKind.Number:
                writer.WriteRawValue(CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(value));
                break;

            case JsonValueKind.True:
                writer.WriteBooleanValue(true);
                break;

            case JsonValueKind.False:
                writer.WriteBooleanValue(false);
                break;

            case JsonValueKind.Null:
                writer.WriteNullValue();
                break;

            case JsonValueKind.Object:
                writer.WriteStartObject();

                foreach (JsonProperty property in value.EnumerateObject()
                             .GroupBy(static property => property.Name, StringComparer.OrdinalIgnoreCase)
                             .Select(static group => group.First())
                             .OrderBy(static property => property.Name, StringComparer.OrdinalIgnoreCase))
                {
                    if (CanonicalInfrastructurePropertyBag.ShouldRedactKey(property.Name))
                    {
                        writer.WritePropertyName(property.Name.ToLowerInvariant());
                        writer.WriteStringValue("[REDACTED]");
                        continue;
                    }

                    writer.WritePropertyName(property.Name.ToLowerInvariant());
                    WriteCanonicalJsonValue(writer, property.Value);
                }

                writer.WriteEndObject();
                break;

            case JsonValueKind.Array:
                writer.WriteStartArray();

                List<JsonElement> items = value.EnumerateArray().ToList();
                items.Sort(static (left, right) =>
                    string.Compare(
                        CanonicalizeText(left),
                        CanonicalizeText(right),
                        StringComparison.OrdinalIgnoreCase));

                foreach (JsonElement item in items)
                    WriteCanonicalJsonValue(writer, item);

                writer.WriteEndArray();
                break;

            default:
                writer.WriteRawValue(value.GetRawText());
                break;
        }
    }
}
