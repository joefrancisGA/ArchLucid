using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Accepts legacy eval-corpus empty arrays for <see cref="AgentResult.ProposedChanges" /> as <see langword="null" />.
/// </summary>
public sealed class AgentTopologyProposalJsonConverter : JsonConverter<AgentTopologyProposal?>
{
    public override AgentTopologyProposal? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        if (reader.TokenType == JsonTokenType.StartArray)
        {
            using JsonDocument document = JsonDocument.ParseValue(ref reader);

            if (document.RootElement.GetArrayLength() == 0)
                return null;

            throw new JsonException("Expected empty array or object for agent topology proposal.");
        }

        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Expected object, null, or empty array for agent topology proposal.");

        return JsonSerializer.Deserialize<AgentTopologyProposal>(ref reader, options);
    }

    public override void Write(Utf8JsonWriter writer, AgentTopologyProposal? value, JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
            return;
        }

        JsonSerializer.Serialize(writer, value, options);
    }
}
