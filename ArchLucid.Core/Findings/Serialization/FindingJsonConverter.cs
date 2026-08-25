using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Core.Findings.Serialization;

/// <summary>
///     Serializes <see cref="Finding.Payload" /> as a typed JSON object; on read, rehydrates using
///     <see cref="FindingPayloadRegistry" />.
/// </summary>
public sealed class FindingJsonConverter : JsonConverter<Finding>
{
    public override Finding Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using JsonDocument doc = JsonDocument.ParseValue(ref reader);
        JsonElement root = doc.RootElement;
        Finding finding = new()
        {
            FindingSchemaVersion =
                root.TryGetProperty("findingSchemaVersion", out JsonElement fsv) && fsv.TryGetInt32(out int v) ? v : 0,
            FindingId = root.GetProperty("findingId").GetString() ?? Guid.NewGuid().ToString("N"),
            FindingType = root.GetProperty("findingType").GetString() ?? "",
            Category = root.TryGetProperty("category", out JsonElement cat) ? cat.GetString() ?? "" : "",
            EngineType = root.GetProperty("engineType").GetString() ?? "",
            Severity = ReadSeverity(root, "severity"),
            Title = root.GetProperty("title").GetString() ?? "",
            Rationale = root.GetProperty("rationale").GetString() ?? "",
            RelatedNodeIds = ReadStringList(root, "relatedNodeIds"),
            RecommendedActions = ReadStringList(root, "recommendedActions"),
            Properties = ReadStringDict(root, "properties"),
            PayloadType = root.TryGetProperty("payloadType", out JsonElement pt) ? pt.GetString() : null
        };

        finding.Trace = ReadTrace(root, options, finding);

        finding.RequestInputRef = ReadOptionalString(root, "requestInputRef");
        finding.RunIdRef = ReadOptionalString(root, "runIdRef");
        finding.AgentExecutionTraceId = ReadOptionalString(root, "agentExecutionTraceId")
                                        ?? finding.Trace.SourceAgentExecutionTraceId;
        finding.ModelDeploymentName = ReadOptionalString(root, "modelDeploymentName");
        finding.ModelVersion = ReadOptionalString(root, "modelVersion");
        finding.PromptTemplateId = ReadOptionalString(root, "promptTemplateId");
        finding.PromptTemplateVersion = ReadOptionalString(root, "promptTemplateVersion");
        finding.PolicyRuleId = ReadOptionalString(root, "policyRuleId");
        finding.ReviewedByUserId = ReadOptionalString(root, "reviewedByUserId");
        finding.ReviewNotes = ReadOptionalString(root, "reviewNotes");

        if (root.TryGetProperty("enforcementTier", out JsonElement tierEl) &&
            TryReadEnforcementTier(tierEl, out FindingEnforcementTier tier))
        {
            finding.EnforcementTier = tier;
        }
        else if (finding.Properties.TryGetValue(FindingPropertyKeys.EnforcementTier, out string? tierFromProps) &&
                 Enum.TryParse(tierFromProps, ignoreCase: true, out FindingEnforcementTier tierFromProperties))
        {
            finding.EnforcementTier = tierFromProperties;
        }

        if (root.TryGetProperty("confidenceScore", out JsonElement confEl) &&
            confEl.ValueKind == JsonValueKind.Number &&
            confEl.TryGetDouble(out double conf))
            finding.ConfidenceScore = conf;

        if (root.TryGetProperty("evaluationConfidenceScore", out JsonElement ecsEl) &&
            ecsEl.ValueKind == JsonValueKind.Number &&
            ecsEl.TryGetInt32(out int ecs))
            finding.EvaluationConfidenceScore = ecs;

        if (root.TryGetProperty("evaluationConfidenceLevel", out JsonElement eclEl) &&
            eclEl.ValueKind == JsonValueKind.String &&
            Enum.TryParse(eclEl.GetString(), ignoreCase: true, out FindingConfidenceLevel ecl))
            finding.ConfidenceLevel = ecl;

        if (root.TryGetProperty("humanReviewStatus", out JsonElement hrsEl) &&
            TryReadHumanReviewStatus(hrsEl, out FindingHumanReviewStatus hrs))
            finding.HumanReviewStatus = hrs;

        if (root.TryGetProperty("projectedImpactUsd", out JsonElement impactEl) &&
            impactEl.ValueKind == JsonValueKind.Number &&
            impactEl.TryGetDecimal(out decimal projectedImpactUsd))
            finding.ProjectedImpactUsd = projectedImpactUsd;

        if (root.TryGetProperty("reviewedAtUtc", out JsonElement raEl) && raEl.ValueKind == JsonValueKind.String &&
            DateTimeOffset.TryParse(raEl.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind,
                out DateTimeOffset ra))
            finding.ReviewedAtUtc = ra;

        ReadInsightDensityFields(root, finding);

        if (!root.TryGetProperty("payload", out JsonElement payloadEl) || payloadEl.ValueKind == JsonValueKind.Null)
            return finding;

        string? typeName = finding.PayloadType;
        Type? payloadType = FindingPayloadRegistry.ResolvePayloadType(typeName);
        try
        {
            finding.Payload = payloadType is not null
                ? JsonSerializer.Deserialize(payloadEl.GetRawText(), payloadType, options)
                : payloadEl.Clone();
        }
        catch (JsonException ex)
        {
            throw new JsonException(
                $"Failed to deserialize payload of type '{typeName}' for finding '{finding.FindingId}'.", ex);
        }

        return finding;
    }

    public override void Write(Utf8JsonWriter writer, Finding value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteNumber("findingSchemaVersion", value.FindingSchemaVersion);
        writer.WriteString("findingId", value.FindingId);
        writer.WriteString("findingType", value.FindingType);
        writer.WriteString("category", value.Category);
        writer.WriteString("engineType", value.EngineType);
        writer.WriteString("severity", value.Severity.ToString());
        writer.WriteString("title", value.Title);
        writer.WriteString("rationale", value.Rationale);
        writer.WritePropertyName("relatedNodeIds");
        JsonSerializer.Serialize(writer, value.RelatedNodeIds, options);
        writer.WritePropertyName("recommendedActions");
        JsonSerializer.Serialize(writer, value.RecommendedActions, options);
        writer.WritePropertyName("properties");
        JsonSerializer.Serialize(writer, value.Properties, options);

        if (value.PayloadType is not null)
            writer.WriteString("payloadType", value.PayloadType);
        else
            writer.WriteNull("payloadType");
        writer.WritePropertyName("payload");

        if (value.Payload is null)
            writer.WriteNullValue();
        else
            JsonSerializer.Serialize(writer, value.Payload, value.Payload.GetType(), options);
        writer.WritePropertyName("trace");
        JsonSerializer.Serialize(writer, value.Trace, options);
        WriteOptionalString(writer, "requestInputRef", value.RequestInputRef);
        WriteOptionalString(writer, "runIdRef", value.RunIdRef);
        WriteOptionalString(writer, "agentExecutionTraceId", value.AgentExecutionTraceId);
        WriteOptionalString(writer, "modelDeploymentName", value.ModelDeploymentName);
        WriteOptionalString(writer, "modelVersion", value.ModelVersion);
        WriteOptionalString(writer, "promptTemplateId", value.PromptTemplateId);
        WriteOptionalString(writer, "promptTemplateVersion", value.PromptTemplateVersion);
        WriteOptionalString(writer, "policyRuleId", value.PolicyRuleId);
        writer.WriteString("enforcementTier", value.EnforcementTier.ToString());

        if (value.ConfidenceScore is { } score)
            writer.WriteNumber("confidenceScore", score);
        else
            writer.WriteNull("confidenceScore");

        if (value.EvaluationConfidenceScore is { } ecs)
            writer.WriteNumber("evaluationConfidenceScore", ecs);
        else
            writer.WriteNull("evaluationConfidenceScore");

        if (value.ConfidenceLevel is { } ecl)
            writer.WriteString("evaluationConfidenceLevel", ecl.ToString());
        else
            writer.WriteNull("evaluationConfidenceLevel");

        writer.WriteString("humanReviewStatus", value.HumanReviewStatus.ToString());

        if (value.ProjectedImpactUsd is { } projectedImpactUsd)
            writer.WriteNumber("projectedImpactUsd", projectedImpactUsd);

        WriteOptionalString(writer, "reviewedByUserId", value.ReviewedByUserId);

        if (value.ReviewedAtUtc is { } ra)
            writer.WriteString("reviewedAtUtc", ra.ToString("O", CultureInfo.InvariantCulture));
        else
            writer.WriteNull("reviewedAtUtc");

        WriteOptionalString(writer, "reviewNotes", value.ReviewNotes);
        WriteInsightDensityFields(writer, value);
        writer.WriteEndObject();
    }

    private static void ReadInsightDensityFields(JsonElement root, Finding finding)
    {
        if (root.TryGetProperty("insightDensityScore", out JsonElement scoreElement) &&
            scoreElement.ValueKind == JsonValueKind.Number &&
            scoreElement.TryGetInt32(out int insightDensityScore))
        {
            finding.InsightDensityScore = insightDensityScore;
        }

        if (root.TryGetProperty("treatment", out JsonElement treatmentElement) &&
            treatmentElement.ValueKind == JsonValueKind.String &&
            Enum.TryParse(treatmentElement.GetString(), ignoreCase: true, out FindingTreatment treatment))
        {
            finding.Treatment = treatment;
        }

        if (root.TryGetProperty("classification", out JsonElement classificationElement) &&
            classificationElement.ValueKind == JsonValueKind.String &&
            Enum.TryParse(classificationElement.GetString(), ignoreCase: true, out FindingClassification classification))
        {
            finding.Classification = classification;
        }

        finding.WhyThisIsNotGeneric = ReadOptionalString(root, "whyThisIsNotGeneric");
        finding.PrincipalArchitectValue = ReadOptionalString(root, "principalArchitectValue");
        finding.DecisionConsequence = ReadOptionalString(root, "decisionConsequence");
    }

    private static void WriteInsightDensityFields(Utf8JsonWriter writer, Finding value)
    {
        if (value.InsightDensityScore is { } insightDensityScore)
            writer.WriteNumber("insightDensityScore", insightDensityScore);

        if (value.Treatment is { } treatment)
            writer.WriteString("treatment", treatment.ToString());

        if (value.Classification is { } classification)
            writer.WriteString("classification", classification.ToString());

        WriteOptionalString(writer, "whyThisIsNotGeneric", value.WhyThisIsNotGeneric);
        WriteOptionalString(writer, "principalArchitectValue", value.PrincipalArchitectValue);
        WriteOptionalString(writer, "decisionConsequence", value.DecisionConsequence);
    }

    /// <summary>
    ///     Deserializes the <c>trace</c> property from <paramref name="root" />.
    ///     When deserialization fails the corrupt JSON is noted in <paramref name="finding" />
    ///     <c>Properties["_traceDeserializationWarning"]</c> so downstream consumers
    ///     can detect data loss without silently discarding the error.
    /// </summary>
    private static ExplainabilityTrace ReadTrace(JsonElement root, JsonSerializerOptions options, Finding finding)
    {
        if (!root.TryGetProperty("trace", out JsonElement tr))
            return new ExplainabilityTrace();
        try
        {
            return JsonSerializer.Deserialize<ExplainabilityTrace>(tr.GetRawText(), options) ??
                   new ExplainabilityTrace();
        }
        catch (JsonException ex)
        {
            finding.Properties["_traceDeserializationWarning"] =
                $"Trace JSON could not be deserialized and was replaced with an empty trace. Error: {ex.Message}";
            return new ExplainabilityTrace();
        }
    }

    private static string? ReadOptionalString(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out JsonElement el) || el.ValueKind is JsonValueKind.Null)
            return null;

        return el.GetString();
    }

    private static void WriteOptionalString(Utf8JsonWriter writer, string name, string? value)
    {
        if (value is null)
        {
            writer.WriteNull(name);

            return;
        }

        writer.WriteString(name, value);
    }

    private static List<string> ReadStringList(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out JsonElement el) || el.ValueKind != JsonValueKind.Array)
            return [];

        return el.EnumerateArray().Select(e => e.GetString() ?? "").Where(s => s.Length > 0).ToList();
    }

    private static Dictionary<string, string> ReadStringDict(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out JsonElement el) || el.ValueKind != JsonValueKind.Object)
            return new Dictionary<string, string>();
        Dictionary<string, string> d = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty p in el.EnumerateObject())
            d[p.Name] = p.Value.GetString() ?? "";
        return d;
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

    /// <summary>
    ///     Accepts enum names and defined integer ordinals. Numeric <c>1</c> is Pending;
    ///     <see cref="JsonElement.GetString"/> must not run on number tokens (that throws).
    /// </summary>
    private static bool TryReadHumanReviewStatus(JsonElement element, out FindingHumanReviewStatus status)
    {
        status = default;

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {

            if (!Enum.IsDefined(typeof(FindingHumanReviewStatus), numeric))
                throw new JsonException($"Unknown finding human review status value '{numeric}'.");

            status = (FindingHumanReviewStatus)numeric;
            return true;
        }

        if (element.ValueKind == JsonValueKind.String &&
            Enum.TryParse(element.GetString(), ignoreCase: true, out FindingHumanReviewStatus parsed))
        {
            status = parsed;
            return true;
        }

        return false;
    }

    private static FindingSeverity ReadSeverity(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement severityElement))
            return FindingSeverity.Info;

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

