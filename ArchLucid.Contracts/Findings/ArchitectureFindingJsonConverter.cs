using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Serialization;

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

        ArchitectureFinding finding = new()
        {
            SeverityStored = false,
            SourceAgentStored = false,
            EnforcementTierStored = false,
        };

        if (TryGetPropertyIgnoreCase(root, "findingId", out JsonElement findingId) && findingId.ValueKind == JsonValueKind.String)
            finding.FindingId = findingId.GetString() ?? finding.FindingId;

        if (TryGetPropertyIgnoreCase(root, "sourceAgent", out JsonElement sourceAgent) &&
            TryReadSourceAgent(sourceAgent, out AgentType agentType))
        {
            finding.SourceAgent = agentType;
            finding.SourceAgentStored = true;
        }

        if (TryGetPropertyIgnoreCase(root, "severity", out JsonElement severityElement))
        {
            finding.Severity = ReadSeverity(severityElement, out bool severityStored);
            finding.SeverityStored = severityStored;
        }

        if (TryGetPropertyIgnoreCase(root, "category", out JsonElement category) && category.ValueKind == JsonValueKind.String)
            finding.Category = category.GetString() ?? string.Empty;

        if (TryGetPropertyIgnoreCase(root, "policyRuleId", out JsonElement policyRuleId) &&
            policyRuleId.ValueKind == JsonValueKind.String)
        {
            finding.PolicyRuleId = policyRuleId.GetString();
        }

        if (TryGetPropertyIgnoreCase(root, "enforcementTier", out JsonElement enforcementTier))
        {
            if (TryReadEnforcementTier(enforcementTier, out FindingEnforcementTier tier))
            {
                finding.EnforcementTier = tier;
                finding.EnforcementTierStored = true;
            }
            else
            {
                throw new JsonException("enforcementTier is required.");
            }
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
        ApplyStoredFlagsFromJson(root, finding);

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
        writer.WriteBoolean("severityStored", value.SeverityStored);
        writer.WriteString("category", value.Category);
        writer.WriteString("enforcementTier", value.EnforcementTier.ToString());
        writer.WriteBoolean("enforcementTierStored", value.EnforcementTierStored);
        writer.WriteBoolean("sourceAgentStored", value.SourceAgentStored);

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
            DefinedEnumStringReader.TryReadWholeNumberInt32(scoreElement, out int insightDensityScore))
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

        if (TryGetPropertyIgnoreCase(root, "semanticSupportBand", out JsonElement supportBandElement) &&
            TryReadFindingSemanticSupportBand(supportBandElement, out FindingSemanticSupportBand supportBand))
        {
            finding.SemanticSupportBand = supportBand;
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

        if (value.SemanticSupportBand is { } semanticSupportBand)
            writer.WriteString("semanticSupportBand", semanticSupportBand.ToString());

        WriteOptionalStringProperty(writer, "whyThisIsNotGeneric", value.WhyThisIsNotGeneric);
        WriteOptionalStringProperty(writer, "principalArchitectValue", value.PrincipalArchitectValue);
        WriteOptionalStringProperty(writer, "decisionConsequence", value.DecisionConsequence);
    }

    private static bool TryReadSourceAgent(JsonElement element, out AgentType agentType)
    {

        if (DefinedEnumStringReader.TryReadDefinedOrdinal(
                element,
                out agentType,
                numeric => new JsonException($"Unknown source agent value '{numeric}'.")))
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.String)
        {
            string? label = element.GetString();

            if (string.IsNullOrWhiteSpace(label))
            {
                agentType = default;
                return false;
            }

            if (DefinedEnumStringReader.TryParse(label, out agentType))
                return true;

            DefinedEnumStringReader.ThrowIfUndefinedNumericString<AgentType>(
                label,
                $"Unknown source agent value '{label}'.");

            if (int.TryParse(label, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericOrdinal)
                && numericOrdinal == 0)
            {
                agentType = default;
                return false;
            }

            throw new JsonException($"Unknown source agent value '{label}'.");
        }

        agentType = default;
        return false;
    }

    private static bool TryReadFindingTreatment(JsonElement element, out FindingTreatment treatment)
    {

        if (DefinedEnumStringReader.TryReadDefinedOrdinal(
                element,
                out treatment,
                numeric => new JsonException($"Unknown finding treatment value '{numeric}'.")))
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();
            DefinedEnumStringReader.ThrowIfUndefinedNumericString<FindingTreatment>(
                raw!,
                $"Unknown finding treatment value '{raw}'.");

            if (DefinedEnumStringReader.TryParse(raw!, out treatment))
                return true;

            throw new JsonException($"Unknown finding treatment value '{raw}'.");
        }

        treatment = default;
        return false;
    }

    private static bool TryReadFindingSemanticSupportBand(
        JsonElement element,
        out FindingSemanticSupportBand supportBand)
    {
        if (DefinedEnumStringReader.TryReadDefinedOrdinal(
                element,
                out supportBand,
                numeric => new JsonException($"Unknown finding semantic support band value '{numeric}'.")))
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();
            DefinedEnumStringReader.ThrowIfUndefinedNumericString<FindingSemanticSupportBand>(
                raw!,
                $"Unknown finding semantic support band value '{raw}'.");

            if (DefinedEnumStringReader.TryParse(raw!, out supportBand))
                return true;

            throw new JsonException($"Unknown finding semantic support band value '{raw}'.");
        }

        supportBand = default;
        return false;
    }

    private static bool TryReadFindingClassification(JsonElement element, out FindingClassification classification)
    {

        if (DefinedEnumStringReader.TryReadDefinedOrdinal(
                element,
                out classification,
                numeric => new JsonException($"Unknown finding classification value '{numeric}'.")))
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();
            DefinedEnumStringReader.ThrowIfUndefinedNumericString<FindingClassification>(
                raw!,
                $"Unknown finding classification value '{raw}'.");

            if (DefinedEnumStringReader.TryParse(raw!, out classification))
                return true;

            throw new JsonException($"Unknown finding classification value '{raw}'.");
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

        if (DefinedEnumStringReader.TryReadDefinedOrdinal(
                element,
                out tier,
                numeric => new JsonException($"Unknown finding enforcement tier value '{numeric}'.")))
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (string.IsNullOrWhiteSpace(raw))
                return false;

            DefinedEnumStringReader.ThrowIfUndefinedNumericString<FindingEnforcementTier>(
                raw,
                $"Unknown finding enforcement tier value '{raw}'.");

            if (DefinedEnumStringReader.TryParse(raw, out tier))
                return true;

            throw new JsonException($"Unknown finding enforcement tier value '{raw}'.");
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

    private static void ApplyStoredFlagsFromJson(JsonElement root, ArchitectureFinding finding)
    {
        if (TryGetPropertyIgnoreCase(root, "severityStored", out JsonElement severityStored))
        {
            finding.SeverityStored = severityStored.ValueKind == JsonValueKind.True;
        }

        if (TryGetPropertyIgnoreCase(root, "sourceAgentStored", out JsonElement sourceAgentStored))
        {
            finding.SourceAgentStored = sourceAgentStored.ValueKind == JsonValueKind.True;
        }

        if (TryGetPropertyIgnoreCase(root, "enforcementTierStored", out JsonElement enforcementTierStored))
        {
            finding.EnforcementTierStored = enforcementTierStored.ValueKind == JsonValueKind.True;
        }
    }

    private static FindingSeverity ReadSeverity(JsonElement severityElement, out bool severityStored)
    {
        severityStored = false;

        if (DefinedEnumStringReader.TryReadDefinedOrdinal(
                severityElement,
                out FindingSeverity numericSeverity,
                numeric => new JsonException($"Unknown finding severity value '{numeric}'.")))
        {
            severityStored = true;
            return numericSeverity;
        }

        if (severityElement.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding severity.");

        string? raw = severityElement.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return FindingSeverity.Info;

        if (Enum.TryParse(raw, ignoreCase: true, out FindingSeverity parsed)
            && Enum.IsDefined(parsed))
        {
            severityStored = true;
            return parsed;
        }

        severityStored = true;

        return raw.Trim().ToLowerInvariant() switch
        {
            "low" => FindingSeverity.Warning,
            "medium" => FindingSeverity.Warning,
            "high" => FindingSeverity.Error,
            _ => throw new JsonException($"Unknown finding severity value '{raw}'."),
        };
    }
}
