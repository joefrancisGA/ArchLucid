using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingClassification" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingClassificationJsonConverter : JsonConverter<FindingClassification>
{
    public override FindingClassification Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<FindingClassification>(
                ref reader,
                ordinal => new JsonException($"Unknown finding classification value '{ordinal}'."),
                () => new JsonException("Invalid finding classification number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding classification.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding classification value is required.");

        DefinedEnumStringReader.ThrowIfUndefinedNumericString<FindingClassification>(
            raw,
            $"Unknown finding classification value '{raw}'.");

        if (DefinedEnumStringReader.TryParse(raw, out FindingClassification parsed))
            return parsed;

        throw new JsonException($"Unknown finding classification value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingClassification value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
