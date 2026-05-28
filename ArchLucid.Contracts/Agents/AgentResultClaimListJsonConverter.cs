using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Accepts legacy string claims and structured eval-corpus objects ({ "detail": "...", "evidenceRefs": [...] }).
/// </summary>
public sealed class AgentResultClaimListJsonConverter : JsonConverter<List<string>>
{
    private static readonly string[] StructuredClaimTextProperties = ["detail", "text", "evidence", "statement", "claim"];

    public override List<string> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartArray)
            throw new JsonException("Expected JSON array for agent result claims.");

        List<string> claims = [];

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndArray)
                return claims;

            string claimText = ReadClaimEntry(ref reader);

            if (!string.IsNullOrWhiteSpace(claimText))
                claims.Add(claimText);
        }

        throw new JsonException("Unexpected end of agent result claims array.");
    }

    public override void Write(Utf8JsonWriter writer, List<string> value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);

        writer.WriteStartArray();

        foreach (string claim in value)
            writer.WriteStringValue(claim);

        writer.WriteEndArray();
    }

    private static string ReadClaimEntry(ref Utf8JsonReader reader)
    {
        if (reader.TokenType == JsonTokenType.String)
            return reader.GetString() ?? string.Empty;

        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Expected string or object for each agent result claim.");

        using JsonDocument document = JsonDocument.ParseValue(ref reader);
        JsonElement claim = document.RootElement;
        List<string> parts = [];

        foreach (string propertyName in StructuredClaimTextProperties)
        {
            if (!claim.TryGetProperty(propertyName, out JsonElement property) ||
                property.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string? text = property.GetString();

            if (!string.IsNullOrWhiteSpace(text))
                parts.Add(text.Trim());
        }

        return string.Join(' ', parts);
    }
}
