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

        if (TryGetProperty(root, "findingId", out JsonElement findingId) && findingId.ValueKind == JsonValueKind.String)
            finding.FindingId = findingId.GetString() ?? finding.FindingId;

        if (TryGetProperty(root, "sourceAgent", out JsonElement sourceAgent) &&
            sourceAgent.ValueKind == JsonValueKind.String &&
            Enum.TryParse(sourceAgent.GetString(), ignoreCase: true, out AgentType agentType))
        {
            finding.SourceAgent = agentType;
        }

        if (TryGetProperty(root, "severity", out JsonElement severityElement))
            finding.Severity = ReadSeverity(severityElement);

        if (TryGetProperty(root, "category", out JsonElement category) && category.ValueKind == JsonValueKind.String)
            finding.Category = category.GetString() ?? string.Empty;

        if (TryGetProperty(root, "policyRuleId", out JsonElement policyRuleId) &&
            policyRuleId.ValueKind == JsonValueKind.String)
        {
            finding.PolicyRuleId = policyRuleId.GetString();
        }

        if (TryGetProperty(root, "enforcementTier", out JsonElement enforcementTier) &&
            enforcementTier.ValueKind == JsonValueKind.String &&
            Enum.TryParse(enforcementTier.GetString(), ignoreCase: true, out FindingEnforcementTier tier))
        {
            finding.EnforcementTier = tier;
        }

        finding.Message = ReadMessage(root);

        if (TryGetProperty(root, "evidenceRefs", out JsonElement evidenceRefs) &&
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

        ReadInsightDensityFields(root, finding);

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
        writer.WriteString("enforcementTier", value.EnforcementTier.ToString());

        if (!string.IsNullOrWhiteSpace(value.PolicyRuleId))
            writer.WriteString("policyRuleId", value.PolicyRuleId);

        writer.WriteString("message", value.Message);

        writer.WritePropertyName("evidenceRefs");
        writer.WriteStartArray();

        foreach (string evidenceRef in value.EvidenceRefs)
            writer.WriteStringValue(evidenceRef);

        writer.WriteEndArray();
        WriteInsightDensityFields(writer, value);
        writer.WriteEndObject();
    }

    private static void ReadInsightDensityFields(JsonElement root, ArchitectureFinding finding)
    {
        if (TryGetProperty(root, "insightDensityScore", out JsonElement scoreElement) &&
            scoreElement.ValueKind == JsonValueKind.Number &&
            scoreElement.TryGetInt32(out int insightDensityScore))
        {
            finding.InsightDensityScore = insightDensityScore;
        }

        if (TryGetProperty(root, "treatment", out JsonElement treatmentElement) &&
            treatmentElement.ValueKind == JsonValueKind.String &&
            Enum.TryParse(treatmentElement.GetString(), ignoreCase: true, out FindingTreatment treatment))
        {
            finding.Treatment = treatment;
        }

        if (TryGetProperty(root, "classification", out JsonElement classificationElement) &&
            classificationElement.ValueKind == JsonValueKind.String &&
            Enum.TryParse(classificationElement.GetString(), ignoreCase: true, out FindingClassification classification))
        {
            finding.Classification = classification;
        }

        finding.WhyThisIsNotGeneric = ReadOptionalStringProperty(root, "whyThisIsNotGeneric");
        finding.PrincipalArchitectValue = ReadOptionalStringProperty(root, "principalArchitectValue");
        finding.DecisionConsequence = ReadOptionalStringProperty(root, "decisionConsequence");
    }

    private static void WriteInsightDensityFields(Utf8JsonWriter writer, ArchitectureFinding value)
    {
        if (value.InsightDensityScore is { } insightDensityScore)
            writer.WriteNumber("insightDensityScore", insightDensityScore);

        if (value.Treatment is { } treatment)
            writer.WriteString("treatment", treatment.ToString());

        if (value.Classification is { } classification)
            writer.WriteString("classification", classification.ToString());

        WriteOptionalStringProperty(writer, "whyThisIsNotGeneric", value.WhyThisIsNotGeneric);
        WriteOptionalStringProperty(writer, "principalArchitectValue", value.PrincipalArchitectValue);
        WriteOptionalStringProperty(writer, "decisionConsequence", value.DecisionConsequence);
    }

    private static string? ReadOptionalStringProperty(JsonElement root, string propertyName)
    {
        if (!TryGetProperty(root, propertyName, out JsonElement property) || property.ValueKind == JsonValueKind.Null)
            return null;

        return property.GetString();
    }

    private static void WriteOptionalStringProperty(Utf8JsonWriter writer, string propertyName, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        writer.WriteString(propertyName, value);
    }

    private static string ReadMessage(JsonElement root)
    {
        foreach (string propertyName in MessagePropertyNames)
        {
            if (!TryGetProperty(root, propertyName, out JsonElement property) ||
                property.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string? text = property.GetString();

            if (!string.IsNullOrWhiteSpace(text))
                return text.Trim();
        }

        if (TryGetProperty(root, "recommendation", out JsonElement recommendation) &&
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
        {
            if (!Enum.IsDefined(typeof(FindingSeverity), numeric))
                throw new JsonException($"Unknown finding severity value '{numeric}'.");

            return (FindingSeverity)numeric;
        }

        if (severityElement.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding severity.");

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
            _ => throw new JsonException($"Unknown finding severity value '{raw}'."),
        };
    }

    private static bool TryGetProperty(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;
            return true;
        }

        value = default;
        return false;
    }
}
