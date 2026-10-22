using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingConfidenceLevel" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingConfidenceLevelJsonConverter : JsonConverter<FindingConfidenceLevel>
{
    public override FindingConfidenceLevel Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<FindingConfidenceLevel>(
                ref reader,
                ordinal => new JsonException($"Unknown finding confidence level value '{ordinal}'."),
                () => new JsonException("Expected integer for finding confidence level."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding confidence level.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding confidence level value is required.");

        if (DefinedEnumStringReader.TryParse(raw, out FindingConfidenceLevel parsed))
            return parsed;

        throw new JsonException($"Unknown finding confidence level value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingConfidenceLevel value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
