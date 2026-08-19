using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Maps legacy eval-corpus severity labels (Low/Medium/High) onto <see cref="FindingSeverity" />.
/// </summary>
public sealed class EvalCorpusFindingSeverityJsonConverter : JsonConverter<FindingSeverity>
{
    public override FindingSeverity Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return (FindingSeverity)reader.GetInt32();

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for finding severity.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return FindingSeverity.Info;

        if (Enum.TryParse(raw, ignoreCase: true, out FindingSeverity parsed))
            return parsed;

        return raw.Trim().ToLowerInvariant() switch
        {
            "low" => FindingSeverity.Info,
            "medium" => FindingSeverity.Warning,
            "high" => FindingSeverity.Error,
            _ => throw new JsonException($"Unknown finding severity value '{raw}'."),
        };
    }

    public override void Write(Utf8JsonWriter writer, FindingSeverity value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
