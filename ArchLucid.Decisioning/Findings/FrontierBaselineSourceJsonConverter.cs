using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Maps kebab-case frontier baseline source tokens in capture JSON.</summary>
public sealed class FrontierBaselineSourceJsonConverter : JsonConverter<FrontierBaselineSource>
{
    public override FrontierBaselineSource Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.String)
        {
            throw new JsonException("frontierBaseline.source must be a string.");
        }

        string? token = reader.GetString();

        return token switch
        {
            "human-authored" => FrontierBaselineSource.HumanAuthored,
            "pilot-pending" => FrontierBaselineSource.PilotPending,
            "empty" => FrontierBaselineSource.Empty,
            _ => throw new JsonException($"Unexpected frontierBaseline.source '{token}'."),
        };
    }

    public override void Write(Utf8JsonWriter writer, FrontierBaselineSource value, JsonSerializerOptions options)
    {
        string token = value switch
        {
            FrontierBaselineSource.HumanAuthored => "human-authored",
            FrontierBaselineSource.PilotPending => "pilot-pending",
            FrontierBaselineSource.Empty => "empty",
            _ => throw new JsonException($"Unexpected frontierBaseline.source enum value '{value}'."),
        };

        writer.WriteStringValue(token);
    }
}
