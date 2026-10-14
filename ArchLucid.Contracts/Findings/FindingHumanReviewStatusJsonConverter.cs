using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingHumanReviewStatus" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingHumanReviewStatusJsonConverter : JsonConverter<FindingHumanReviewStatus>
{
    public override FindingHumanReviewStatus Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<FindingHumanReviewStatus>(
                ref reader,
                ordinal => new JsonException($"Unknown finding human review status value '{ordinal}'."),
                () => new JsonException("Invalid finding human review status number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding human review status.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding human review status value is required.");

        if (DefinedEnumStringReader.TryParse(raw, out FindingHumanReviewStatus parsed))
            return parsed;

        throw new JsonException($"Unknown finding human review status value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingHumanReviewStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
