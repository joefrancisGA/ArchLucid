using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="AgentType" /> from enum names or stable dispatch keys (e.g. <c>topology</c>).
/// </summary>
public sealed class AgentTypeJsonConverter : JsonConverter<AgentType>
{
    public override AgentType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return (AgentType)reader.GetInt32();

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for agent type.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Agent type value is required.");

        AgentType? fromKey = AgentTypeKeys.TryMapToEnum(raw);

        if (fromKey.HasValue)
            return fromKey.Value;

        if (Enum.TryParse(raw, ignoreCase: true, out AgentType parsed))
            return parsed;

        throw new JsonException($"Unknown agent type value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, AgentType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(AgentTypeKeys.FromEnum(value));
}
