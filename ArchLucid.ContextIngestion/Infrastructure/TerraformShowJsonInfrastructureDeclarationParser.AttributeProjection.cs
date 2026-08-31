using System.Text;
using System.Text.Json;

namespace ArchLucid.ContextIngestion.Infrastructure;

public sealed partial class TerraformShowJsonInfrastructureDeclarationParser
{
    private static string CanonicalizeTerraformValueText(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => (value.GetString() ?? string.Empty).Trim().ToLowerInvariant(),
            JsonValueKind.Number => CanonicalizeTerraformNumberText(value),
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
                writer.WriteRawValue(CanonicalizeTerraformNumberText(value));
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
                    writer.WritePropertyName(property.Name.ToLowerInvariant());
                    WriteCanonicalJsonValue(writer, property.Value);
                }

                writer.WriteEndObject();
                break;

            case JsonValueKind.Array:
                writer.WriteStartArray();

                foreach (JsonElement item in value.EnumerateArray())
                    WriteCanonicalJsonValue(writer, item);

                writer.WriteEndArray();
                break;

            default:
                writer.WriteRawValue(value.GetRawText());
                break;
        }
    }

    private static string CanonicalizeTerraformNumberText(JsonElement value)
        => CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(value);

    private static void RedactTopLevelSensitiveTfValues(
        JsonElement sensitiveRoot,
        Dictionary<string, string> properties)
    {
        foreach (JsonProperty sensitiveProperty in sensitiveRoot.EnumerateObject())
        {
            string sanitizedKey = CanonicalInfrastructurePropertyBag.SanitizePropertyKey(sensitiveProperty.Name).ToLowerInvariant();

            if (string.IsNullOrEmpty(sanitizedKey))
                continue;

            string propertyKey = $"tf.{sanitizedKey}";

            if (!properties.ContainsKey(propertyKey))
                continue;

            if (sensitiveProperty.Value.ValueKind is JsonValueKind.True
                || ContainsSensitiveMarker(sensitiveProperty.Value))
            {
                properties[propertyKey] = "[REDACTED]";
            }
        }
    }

    private static bool ContainsSensitiveMarker(JsonElement value)
    {
        if (value.ValueKind is JsonValueKind.True)
            return true;

        if (value.ValueKind is JsonValueKind.Object)
        {
            foreach (JsonProperty nestedProperty in value.EnumerateObject())
            {
                if (ContainsSensitiveMarker(nestedProperty.Value))
                    return true;
            }

            return false;
        }

        if (value.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement item in value.EnumerateArray())
            {
                if (ContainsSensitiveMarker(item))
                    return true;
            }
        }

        return false;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.TryGetProperty(propertyName, out value))
            return true;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
