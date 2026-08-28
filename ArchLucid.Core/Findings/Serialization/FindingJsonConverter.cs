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
public sealed partial class FindingJsonConverter : JsonConverter<Finding>
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
            Category = TryGetPropertyCaseInsensitive(root, "category", out JsonElement cat)
                ? cat.GetString() ?? ""
                : "",
            EngineType = root.GetProperty("engineType").GetString() ?? "",
            Severity = ReadSeverity(root, "severity"),
            Title = root.GetProperty("title").GetString() ?? "",
            Rationale = root.GetProperty("rationale").GetString() ?? "",
            RelatedNodeIds = ReadStringList(root, "relatedNodeIds"),
            RecommendedActions = ReadStringList(root, "recommendedActions"),
            Properties = ReadStringDict(root, "properties"),
            PayloadType = TryGetPropertyCaseInsensitive(root, "payloadType", out JsonElement pt)
                ? pt.GetString()
                : null
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

        if (TryGetPropertyCaseInsensitive(root, "enforcementTier", out JsonElement tierEl))
        {
            finding.EnforcementTier = ReadEnforcementTier(tierEl);
        }
        else if (finding.Properties.TryGetValue(FindingPropertyKeys.EnforcementTier, out string? tierFromProps))
        {
            finding.EnforcementTier = ReadEnforcementTierFromString(tierFromProps);
        }

        if (ReadOptionalDouble(root, "confidenceScore") is { } confidenceScore)
            finding.ConfidenceScore = confidenceScore;

        if (ReadOptionalInt32(root, "evaluationConfidenceScore") is { } evaluationConfidenceScore)
            finding.EvaluationConfidenceScore = evaluationConfidenceScore;

        if (TryGetPropertyCaseInsensitive(root, "evaluationConfidenceLevel", out JsonElement eclEl))
            finding.ConfidenceLevel = ReadConfidenceLevel(eclEl);

        if (TryGetPropertyCaseInsensitive(root, "humanReviewStatus", out JsonElement hrsEl))
            finding.HumanReviewStatus = ReadHumanReviewStatus(hrsEl);

        if (ReadOptionalDecimal(root, "projectedImpactUsd") is { } projectedImpactUsd)
            finding.ProjectedImpactUsd = projectedImpactUsd;

        finding.ReviewedAtUtc = ReadOptionalDateTimeOffset(root, "reviewedAtUtc");

        ReadInsightDensityFields(root, finding);

        if (!TryGetPropertyCaseInsensitive(root, "payload", out JsonElement payloadEl) ||
            payloadEl.ValueKind == JsonValueKind.Null)
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
}
