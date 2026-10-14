using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="AgentTaskStatus" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class AgentTaskStatusJsonConverter : JsonConverter<AgentTaskStatus>
{
    public override AgentTaskStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<AgentTaskStatus>(
                ref reader,
                ordinal => new JsonException($"Unknown agent task status value '{ordinal}'."),
                () => new JsonException("Invalid agent task status number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for agent task status.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Agent task status value is required.");

        if (DefinedEnumStringReader.TryParse(raw, out AgentTaskStatus parsed))
            return parsed;

        throw new JsonException($"Unknown agent task status value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, AgentTaskStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
