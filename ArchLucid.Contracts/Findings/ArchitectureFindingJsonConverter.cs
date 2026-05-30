using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Maps live-LLM finding field aliases (description, title, recommendation) onto <see cref="ArchitectureFinding.Message" />.
/// </summary>
public sealed class ArchitectureFindingJsonConverter : JsonConverter<ArchitectureFinding>
{
    private static readonly string[] MessagePropertyNames = ["message", "description", "title", "detail"];

    public override ArchitectureFinding? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Expected JSON object for architecture finding.");

        using JsonDocument document = JsonDocument.ParseValue(ref reader);
        JsonElement root = document.RootElement;

        ArchitectureFinding finding = new();

        if (root.TryGetProperty("findingId", out JsonElement findingId) && findingId.ValueKind == JsonValueKind.String)
            finding.FindingId = findingId.GetString() ?? finding.FindingId;

        if (root.TryGetProperty("sourceAgent", out JsonElement sourceAgent) &&
            sourceAgent.ValueKind == JsonValueKind.String &&
            Enum.TryParse(sourceAgent.GetString(), ignoreCase: true, out AgentType agentType))
        {
            finding.SourceAgent = agentType;
        }

        if (root.TryGetProperty("severity", out JsonElement severityElement))
            finding.Severity = ReadSeverity(severityElement);

        if (root.TryGetProperty("category", out JsonElement category) && category.ValueKind == JsonValueKind.String)
            finding.Category = category.GetString() ?? string.Empty;

        finding.Message = ReadMessage(root);

        if (root.TryGetProperty("evidenceRefs", out JsonElement evidenceRefs) &&
            evidenceRefs.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement item in evidenceRefs.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    string? value = item.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        finding.EvidenceRefs.Add(value);
                }
            }
        }

        return finding;
    }

    public override void Write(Utf8JsonWriter writer, ArchitectureFinding value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);

        writer.WriteStartObject();
        writer.WriteString("findingId", value.FindingId);
        writer.WriteString("sourceAgent", value.SourceAgent.ToString());
        writer.WriteString("severity", value.Severity.ToString());
        writer.WriteString("category", value.Category);
        writer.WriteString("message", value.Message);

        writer.WritePropertyName("evidenceRefs");
        writer.WriteStartArray();

        foreach (string evidenceRef in value.EvidenceRefs)
            writer.WriteStringValue(evidenceRef);

        writer.WriteEndArray();
        writer.WriteEndObject();
    }

    private static string ReadMessage(JsonElement root)
    {
        foreach (string propertyName in MessagePropertyNames)
        {
            if (!root.TryGetProperty(propertyName, out JsonElement property) ||
                property.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string? text = property.GetString();

            if (!string.IsNullOrWhiteSpace(text))
                return text.Trim();
        }

        if (root.TryGetProperty("recommendation", out JsonElement recommendation) &&
            recommendation.ValueKind == JsonValueKind.String)
        {
            string? text = recommendation.GetString();

            if (!string.IsNullOrWhiteSpace(text))
                return text.Trim();
        }

        return string.Empty;
    }

    private static FindingSeverity ReadSeverity(JsonElement severityElement)
    {
        if (severityElement.ValueKind == JsonValueKind.Number && severityElement.TryGetInt32(out int numeric))
            return (FindingSeverity)numeric;

        if (severityElement.ValueKind != JsonValueKind.String)
            return FindingSeverity.Info;

        string? raw = severityElement.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return FindingSeverity.Info;

        if (Enum.TryParse(raw, ignoreCase: true, out FindingSeverity parsed))
            return parsed;

        return raw.Trim().ToLowerInvariant() switch
        {
            "low" => FindingSeverity.Info,
            "medium" => FindingSeverity.Warning,
            "high" => FindingSeverity.Error,
            _ => FindingSeverity.Info
        };
    }
}
