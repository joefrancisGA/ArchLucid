using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="ArchitectureRunStatus" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class ArchitectureRunStatusJsonConverter : JsonConverter<ArchitectureRunStatus>
{
    public override ArchitectureRunStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            int ordinal = reader.GetInt32();

            if (!Enum.IsDefined(typeof(ArchitectureRunStatus), ordinal))
                throw new JsonException($"Unknown architecture run status value '{ordinal}'.");

            return (ArchitectureRunStatus)ordinal;
        }

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for architecture run status.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Architecture run status value is required.");

        if (Enum.TryParse(raw, ignoreCase: true, out ArchitectureRunStatus parsed))
            return parsed;

        throw new JsonException($"Unknown architecture run status value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, ArchitectureRunStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
