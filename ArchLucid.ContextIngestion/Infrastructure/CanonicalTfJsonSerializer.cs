using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Canonical JSON serialization for <c>tf.*</c> object/array property values.
/// </summary>
internal static class CanonicalTfJsonSerializer
{
    public static string Serialize(JsonElement value)
    {
        using MemoryStream stream = new();
        using Utf8JsonWriter writer = new(stream);
        WriteValue(writer, value);
        writer.Flush();

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    public static bool ContainsSensitiveNestedKey(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.Object => value.EnumerateObject().Any(property =>
                CanonicalInfrastructurePropertyBag.ShouldRedactKey(property.Name)
                || ContainsSensitiveNestedKey(property.Value)),
            JsonValueKind.Array => value.EnumerateArray().Any(ContainsSensitiveNestedKey),
            _ => false,
        };
    }

    private static void WriteValue(Utf8JsonWriter writer, JsonElement value)
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
                             .OrderBy(static property => property.Name, StringComparer.OrdinalIgnoreCase))
                {
                    string propertyName = property.Name.ToLowerInvariant();

                    if (CanonicalInfrastructurePropertyBag.ShouldRedactKey(property.Name))
                    {
                        writer.WriteString(propertyName, "[REDACTED]");
                        continue;
                    }

                    writer.WritePropertyName(propertyName);
                    WriteValue(writer, property.Value);
                }

                writer.WriteEndObject();
                break;

            case JsonValueKind.Array:
                writer.WriteStartArray();

                foreach (JsonElement item in value.EnumerateArray())
                    WriteValue(writer, item);

                writer.WriteEndArray();
                break;

            default:
                writer.WriteRawValue(value.GetRawText());
                break;
        }
    }
}
