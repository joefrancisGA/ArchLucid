using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingSemanticSupportBand" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingSemanticSupportBandJsonConverter : JsonConverter<FindingSemanticSupportBand>
{
    public override FindingSemanticSupportBand Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<FindingSemanticSupportBand>(
                ref reader,
                ordinal => new JsonException($"Unknown finding semantic support band value '{ordinal}'."),
                () => new JsonException("Invalid finding semantic support band number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding semantic support band.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding semantic support band value is required.");

        DefinedEnumStringReader.ThrowIfUndefinedNumericString<FindingSemanticSupportBand>(
            raw,
            $"Unknown finding semantic support band value '{raw}'.");

        if (DefinedEnumStringReader.TryParse(raw, out FindingSemanticSupportBand parsed))
            return parsed;

        throw new JsonException($"Unknown finding semantic support band value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingSemanticSupportBand value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
