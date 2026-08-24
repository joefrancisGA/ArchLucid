using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="AgentTaskStatus" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class AgentTaskStatusJsonConverter : JsonConverter<AgentTaskStatus>
{
    public override AgentTaskStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            int ordinal = reader.GetInt32();

            if (!Enum.IsDefined(typeof(AgentTaskStatus), ordinal))
                throw new JsonException($"Unknown agent task status value '{ordinal}'.");

            return (AgentTaskStatus)ordinal;
        }

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for agent task status.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Agent task status value is required.");

        if (Enum.TryParse(raw, ignoreCase: true, out AgentTaskStatus parsed))
            return parsed;

        throw new JsonException($"Unknown agent task status value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, AgentTaskStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
