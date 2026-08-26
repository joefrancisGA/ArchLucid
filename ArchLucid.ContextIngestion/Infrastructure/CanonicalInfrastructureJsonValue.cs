using System.Text;
using System.Text.Json;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Canonical JSON serialization for infrastructure <c>tf.*</c> blob properties.
/// </summary>
internal static class CanonicalInfrastructureJsonValue
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

    public static string SerializeCanonicalJson(JsonElement value)
    {
        using MemoryStream stream = new();
        using Utf8JsonWriter writer = new(stream);
        WriteCanonicalJsonValue(writer, value);
        writer.Flush();

        return Encoding.UTF8.GetString(stream.ToArray());
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
                             .GroupBy(static property => property.Name.ToLowerInvariant(), StringComparer.Ordinal)
                             .OrderBy(static group => group.Key, StringComparer.Ordinal)
                             .Select(static group => group.OrderBy(static property => property.Name, StringComparer.Ordinal).First()))
                {
                    writer.WritePropertyName(property.Name.ToLowerInvariant());
                    WriteCanonicalJsonValue(writer, property.Value, property.Name);
                }

                writer.WriteEndObject();
                break;

            case JsonValueKind.Array:
                writer.WriteStartArray();

                foreach (JsonElement item in value.EnumerateArray()
                             .Select(static element => element)
                             .OrderBy(static element => CanonicalizeText(element), StringComparer.Ordinal))
                    WriteCanonicalJsonValue(writer, item);

                writer.WriteEndArray();
                break;

            default:
                writer.WriteRawValue(value.GetRawText());
                break;
        }
    }

    private static void WriteCanonicalJsonValue(Utf8JsonWriter writer, JsonElement value, string propertyName)
    {
        if (CanonicalInfrastructurePropertyBag.ShouldRedactKey(propertyName))
        {
            writer.WriteStringValue("[REDACTED]");
            return;
        }

        WriteCanonicalJsonValue(writer, value);
    }
}
