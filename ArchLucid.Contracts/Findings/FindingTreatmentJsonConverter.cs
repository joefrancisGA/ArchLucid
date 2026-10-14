using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingTreatment" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingTreatmentJsonConverter : JsonConverter<FindingTreatment>
{
    public override FindingTreatment Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<FindingTreatment>(
                ref reader,
                ordinal => new JsonException($"Unknown finding treatment value '{ordinal}'."),
                () => new JsonException("Invalid finding treatment number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding treatment.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding treatment value is required.");

        if (DefinedEnumStringReader.TryParse(raw, out FindingTreatment parsed))
            return parsed;

        throw new JsonException($"Unknown finding treatment value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingTreatment value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
