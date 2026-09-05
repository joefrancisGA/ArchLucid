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

        if (TryGetPropertyIgnoreCase(root, "findingId", out JsonElement findingId) && findingId.ValueKind == JsonValueKind.String)
            finding.FindingId = findingId.GetString() ?? finding.FindingId;

        if (TryGetPropertyIgnoreCase(root, "sourceAgent", out JsonElement sourceAgent) &&
            TryReadSourceAgent(sourceAgent, out AgentType agentType))
        {
            finding.SourceAgent = agentType;
        }

        if (TryGetPropertyIgnoreCase(root, "severity", out JsonElement severityElement))
            finding.Severity = ReadSeverity(severityElement);

        if (TryGetPropertyIgnoreCase(root, "category", out JsonElement category) && category.ValueKind == JsonValueKind.String)
            finding.Category = category.GetString() ?? string.Empty;

        if (TryGetPropertyIgnoreCase(root, "policyRuleId", out JsonElement policyRuleId) &&
            policyRuleId.ValueKind == JsonValueKind.String)
        {
            finding.PolicyRuleId = policyRuleId.GetString();
        }

        if (TryGetPropertyIgnoreCase(root, "enforcementTier", out JsonElement enforcementTier)
            && TryReadEnforcementTier(enforcementTier, out FindingEnforcementTier tier))
        {
            finding.EnforcementTier = tier;
        }
        else
        {
            throw new JsonException("enforcementTier is required.");
        }

        finding.Message = ReadMessage(root);

        if (TryGetPropertyIgnoreCase(root, "evidenceRefs", out JsonElement evidenceRefs) &&
            evidenceRefs.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement item in evidenceRefs.EnumerateArray())
            {
                string? reference = ReadEvidenceRef(item);

                if (!string.IsNullOrWhiteSpace(reference))
                    finding.EvidenceRefs.Add(reference);
            }
        }

        ReadInsightDensityFields(root, finding);

        return finding;
    }

    public override void Write(Utf8JsonWriter writer, ArchitectureFinding value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);

        if (!Enum.IsDefined(value.EnforcementTier))
        {
            throw new JsonException("enforcementTier must be a valid tier when writing architecture findings.");
        }

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
        if (TryGetPropertyIgnoreCase(root, "insightDensityScore", out JsonElement scoreElement) &&
            scoreElement.ValueKind == JsonValueKind.Number &&
            scoreElement.TryGetInt32(out int insightDensityScore))
        {
            finding.InsightDensityScore = insightDensityScore;
        }

        if (TryGetPropertyIgnoreCase(root, "treatment", out JsonElement treatmentElement) &&
            TryReadFindingTreatment(treatmentElement, out FindingTreatment treatment))
        {
            finding.Treatment = treatment;
        }

        if (TryGetPropertyIgnoreCase(root, "classification", out JsonElement classificationElement) &&
            TryReadFindingClassification(classificationElement, out FindingClassification classification))
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

    private static bool TryReadSourceAgent(JsonElement element, out AgentType agentType)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {

            if (!Enum.IsDefined(typeof(AgentType), numeric))
                throw new JsonException($"Unknown source agent value '{numeric}'.");

            agentType = (AgentType)numeric;
            return true;
        }

        if (element.ValueKind == JsonValueKind.String &&
            Enum.TryParse(element.GetString(), ignoreCase: true, out AgentType parsed))
        {
            agentType = parsed;
            return true;
        }

        agentType = default;
        return false;
    }

    private static bool TryReadFindingTreatment(JsonElement element, out FindingTreatment treatment)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {

            if (!Enum.IsDefined(typeof(FindingTreatment), numeric))
                throw new JsonException($"Unknown finding treatment value '{numeric}'.");

            treatment = (FindingTreatment)numeric;
            return true;
        }

        if (element.ValueKind == JsonValueKind.String &&
            Enum.TryParse(element.GetString(), ignoreCase: true, out FindingTreatment parsed))
        {
            treatment = parsed;
            return true;
        }

        treatment = default;
        return false;
    }

    private static bool TryReadFindingClassification(JsonElement element, out FindingClassification classification)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {

            if (!Enum.IsDefined(typeof(FindingClassification), numeric))
                throw new JsonException($"Unknown finding classification value '{numeric}'.");

            classification = (FindingClassification)numeric;
            return true;
        }

        if (element.ValueKind == JsonValueKind.String &&
            Enum.TryParse(element.GetString(), ignoreCase: true, out FindingClassification parsed))
        {
            classification = parsed;
            return true;
        }

        classification = default;
        return false;
    }

    /// <summary>
    ///     Accepts enum names and defined integer ordinals. Numeric <c>1</c> is Advisory;
    ///     out-of-range ordinals throw so they cannot collapse to the PolicyViolation default.
    /// </summary>
    private static bool TryReadEnforcementTier(JsonElement element, out FindingEnforcementTier tier)
    {
        tier = default;

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {

            if (!Enum.IsDefined(typeof(FindingEnforcementTier), numeric))
                throw new JsonException($"Unknown finding enforcement tier value '{numeric}'.");

            tier = (FindingEnforcementTier)numeric;
            return true;
        }

        if (element.ValueKind == JsonValueKind.String &&
            Enum.TryParse(element.GetString(), ignoreCase: true, out FindingEnforcementTier parsed))
        {
            tier = parsed;
            return true;
        }

        return false;
    }

    private static string? ReadEvidenceRef(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
            return item.GetString();

        if (item.ValueKind != JsonValueKind.Object)
            return null;

        if (TryGetPropertyIgnoreCase(item, "id", out JsonElement id) && id.ValueKind == JsonValueKind.String)
            return id.GetString();

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
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

    private static string? ReadOptionalStringProperty(JsonElement root, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(root, propertyName, out JsonElement property) || property.ValueKind == JsonValueKind.Null)
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
            if (!TryGetPropertyIgnoreCase(root, propertyName, out JsonElement property) ||
                property.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string? text = property.GetString();

            if (!string.IsNullOrWhiteSpace(text))
                return text.Trim();
        }

        if (TryGetPropertyIgnoreCase(root, "recommendation", out JsonElement recommendation) &&
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
}
