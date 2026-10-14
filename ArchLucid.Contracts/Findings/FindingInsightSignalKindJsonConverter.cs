using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingInsightSignalKind" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingInsightSignalKindJsonConverter : JsonConverter<FindingInsightSignalKind>
{
    public override FindingInsightSignalKind Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<FindingInsightSignalKind>(
                ref reader,
                ordinal => new JsonException($"Unknown finding insight signal kind value '{ordinal}'."),
                () => new JsonException("Invalid finding insight signal kind number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding insight signal kind.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding insight signal kind value is required.");

        DefinedEnumStringReader.ThrowIfUndefinedNumericString<FindingInsightSignalKind>(
            raw,
            $"Unknown finding insight signal kind value '{raw}'.");

        if (DefinedEnumStringReader.TryParse(raw, out FindingInsightSignalKind parsed))
            return parsed;

        throw new JsonException($"Unknown finding insight signal kind value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingInsightSignalKind value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
