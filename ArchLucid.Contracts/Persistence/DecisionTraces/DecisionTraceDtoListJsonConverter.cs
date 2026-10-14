using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Persistence.DecisionTraces;

/// <summary>
///     Deserializes decision-trace arrays without leaving explicit JSON <c>null</c> on the backing field
///     (STJ can bypass property setters for <see cref="List{T}" /> when <see cref="DecisionTraceDto" /> has a type converter).
/// </summary>
public sealed class DecisionTraceDtoListJsonConverter : JsonConverter<List<DecisionTraceDto>>
{
    public override List<DecisionTraceDto> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return [];

        if (reader.TokenType != JsonTokenType.StartArray)
            throw new JsonException("Expected JSON array for decision traces.");

        List<DecisionTraceDto> list = [];

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndArray)
                return list;

            DecisionTraceDto? item = JsonSerializer.Deserialize<DecisionTraceDto>(ref reader, options);

            if (item is not null)
                list.Add(item);
        }

        throw new JsonException("Unexpected end of decision traces array.");
    }

    public override void Write(Utf8JsonWriter writer, List<DecisionTraceDto> value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);

        writer.WriteStartArray();

        foreach (DecisionTraceDto trace in value)
            JsonSerializer.Serialize(writer, trace, options);

        writer.WriteEndArray();
    }
}
