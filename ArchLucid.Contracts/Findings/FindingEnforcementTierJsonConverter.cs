using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingEnforcementTier" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingEnforcementTierJsonConverter : JsonConverter<FindingEnforcementTier>
{
    public override FindingEnforcementTier Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            int ordinal = reader.GetInt32();

            if (!Enum.IsDefined(typeof(FindingEnforcementTier), ordinal))
                throw new JsonException($"Unknown finding enforcement tier value '{ordinal}'.");

            return (FindingEnforcementTier)ordinal;
        }

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding enforcement tier.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding enforcement tier value is required.");

        if (Enum.TryParse(raw, ignoreCase: true, out FindingEnforcementTier parsed))
            return parsed;

        throw new JsonException($"Unknown finding enforcement tier value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, FindingEnforcementTier value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
