using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="CloudProvider" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class CloudProviderJsonConverter : JsonConverter<CloudProvider>
{
    public override CloudProvider Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<CloudProvider>(
                ref reader,
                ordinal => new JsonException($"Unknown cloud provider value '{ordinal}'."),
                () => new JsonException("Invalid cloud provider number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for cloud provider.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Cloud provider value is required.");

        if (DefinedEnumStringReader.TryParse(raw, out CloudProvider parsed))
            return parsed;

        throw new JsonException($"Unknown cloud provider value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, CloudProvider value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
