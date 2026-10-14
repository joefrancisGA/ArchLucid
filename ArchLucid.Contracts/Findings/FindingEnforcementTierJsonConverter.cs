using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingEnforcementTier" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingEnforcementTierJsonConverter : JsonConverter<FindingEnforcementTier>
{
    public override FindingEnforcementTier Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<FindingEnforcementTier>(
                ref reader,
                ordinal => new JsonException($"Unknown finding enforcement tier value '{ordinal}'."),
                () => new JsonException("Invalid finding enforcement tier number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding enforcement tier.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding enforcement tier value is required.");

        if (DefinedEnumStringReader.TryParse(raw, out FindingEnforcementTier parsed))
            return parsed;

        throw new JsonException($"Unknown finding enforcement tier value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingEnforcementTier value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
