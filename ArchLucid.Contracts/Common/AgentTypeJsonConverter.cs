using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="AgentType" /> from enum names or stable dispatch keys (e.g. <c>topology</c>).
/// </summary>
public sealed class AgentTypeJsonConverter : JsonConverter<AgentType>
{
    public override AgentType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<AgentType>(
                ref reader,
                ordinal => new JsonException($"Unknown agent type value '{ordinal}'."),
                () => new JsonException("Invalid agent type number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for agent type.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Agent type value is required.");

        AgentType? fromKey = AgentTypeKeys.TryMapToEnum(raw);

        if (fromKey.HasValue)
            return fromKey.Value;

        if (DefinedEnumStringReader.TryParse(raw, out AgentType parsed))
            return parsed;

        throw new JsonException($"Unknown agent type value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, AgentType value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(writer);

        // default(AgentType) is 0 and is not a pipeline role. Findings and results often omit
        // SourceAgent/AgentType; persist topology so clone/merge JSON round-trips instead of throwing.

        if (value == default)
        {
            writer.WriteStringValue(AgentTypeKeys.Topology);
            return;
        }

        writer.WriteStringValue(AgentTypeKeys.FromEnum(value));
    }
}
